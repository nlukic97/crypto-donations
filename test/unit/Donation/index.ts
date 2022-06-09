import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";

describe("Unit tests", function () {
  let NftFactory: ContractFactory;
  let Nft: Contract;
  let DonationFactory: ContractFactory;
  let Donation: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  const dayInSeconds: number = 86400; //a day in seconds
  const currentTimestamp: number = Math.round(new Date().getTime() / 1000);
  const deadline: number = currentTimestamp + 2 * dayInSeconds; //campaign lasts 2 days from now

  const campaignArgs: (string | number | BigNumber)[] = [
    "title",
    "description",
    deadline,
    ethers.utils.parseEther("100"),
  ];

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();
  });

  beforeEach(async function () {
    NftFactory = await ethers.getContractFactory("NftReward");
    Nft = await NftFactory.connect(owner).deploy();

    DonationFactory = await ethers.getContractFactory("Donation");
    Donation = await DonationFactory.connect(owner).deploy();

    await Donation.setNftAddress(Nft.address);
    await Nft.transferOwnership(Donation.address); // so only the Donation SC can mint new NFT's
  });

  describe("Donation contract", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await Donation.owner()).to.be.equal(owner.address);
    });

    it("Should create campaign", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]); // setting SC timestamp to accurate one
      expect((await Donation.campaigns(0)).registered).to.equal(false);

      await expect(Donation.newCampaign(...campaignArgs))
        .to.emit(Donation, "NewCampaign")
        .withArgs(...campaignArgs);

      const campaign1 = await Donation.campaigns(0);

      expect(campaign1.name).to.be.equal("title");
      expect(campaign1.description).to.be.equal("description");
      expect(campaign1.timeGoal).to.be.equal(deadline).and.to.be.above(currentTimestamp);
      expect(campaign1.moneyGoal).to.be.equal(ethers.utils.parseEther("100"));
      expect(campaign1.registered).to.equal(true);
      expect(campaign1.complete).to.equal(false);
    });

    it("Should revert empty strings", async function () {
      await expect(
        Donation.newCampaign("", "Description", deadline, ethers.utils.parseEther("100")),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(Donation.newCampaign("title", "", deadline, ethers.utils.parseEther("100"))).to.be.revertedWith(
        "NoEmptyStrings",
      );
      await expect(Donation.newCampaign("", "", deadline, ethers.utils.parseEther("100"))).to.be.revertedWith(
        "NoEmptyStrings",
      );
    });

    it("should revert 0 moneyGoal", async function () {
      await expect(Donation.newCampaign("title", "description", deadline, 0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should accept donation", async function () {
      await Donation.newCampaign(...campaignArgs);

      expect(await Donation._donated(alice.address)).to.equal(false);
      await expect(Donation.connect(alice).donate(0, { value: 1 }))
        .to.emit(Donation, "NewDonation")
        .withArgs(0, 1);
      expect(await Donation._donated(alice.address)).to.equal(true);

      expect(await Donation._donated(bob.address)).to.equal(false);
      await expect(Donation.connect(bob).donate(0, { value: 3 }))
        .to.emit(Donation, "NewDonation")
        .withArgs(0, 3);
      expect(await Donation._donated(bob.address)).to.equal(true);

      expect(await Donation.campaignBalances(0)).to.equal(4);
    });

    it("should revert donation with no funds", async function () {
      await Donation.newCampaign(...campaignArgs);

      await expect(Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(Donation.connect(alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
    });

    it("Should revert campaign if timeGoal than is in the past", async function () {
      await expect(Donation.newCampaign("title", "description", currentTimestamp - 1, 1)).to.be.revertedWith(
        "InvalidTimeGoal",
      );
    });

    it("Should revert campaign if moneyGoal is not 1 or above", async function () {
      await expect(Donation.newCampaign("title", "description", deadline, 0)).to.be.revertedWith("InsufficientAmount");

      await expect(Donation.newCampaign(...campaignArgs))
        .to.emit(Donation, "NewCampaign")
        .withArgs(...campaignArgs);
    });

    it("should revert withdrawl from incomplete campaign", async function () {
      await Donation.newCampaign(...campaignArgs);
      await Donation.connect(alice).connect(alice).donate(0, { value: 1 });
      await expect(Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    it("should revert donations to non-existant campaigns", async function () {
      await expect(Donation.connect(alice).donate(5678, { value: 2 })).to.be.revertedWith("NonExistantCampaign");
    });

    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    it("should revert donations when msg.value is 0", async function () {
      await Donation.newCampaign(...campaignArgs);
      await expect(Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should revert withdrawl from wallets that are not the owners", async function () {
      await Donation.newCampaign(...campaignArgs);
      await Donation.connect(alice).donate(0, { value: 1 });
      await expect(Donation.connect(alice).withdraw(1)).to.be.reverted;
    });

    it("should return excess Eth to user who sent more than necessary to complete campaign", async function () {
      await Donation.newCampaign(...campaignArgs); // goal is 100 eth
      const initialBalance = alice.getBalance();
      await Donation.connect(alice).donate(0, { value: ethers.utils.parseEther("1000") }); // payee pays 1000 eth, 100eth should be taken and 900ethshould be returned

      const currentBalance = await alice.getBalance();
      const diff = currentBalance.sub(await initialBalance);
      expect(parseInt(ethers.utils.formatEther(diff))).to.equal(-100); // ... making a difference in balance of around -100 eth after
    });

    it("should withdraw from campaign where only money goal is reached", async function () {
      await Donation.newCampaign(...campaignArgs);
      await Donation.connect(alice).donate(0, { value: parseEther("100") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(Donation.withdraw(0)).to.emit(Donation, "FundsWithdrawn").withArgs(0, parseEther("100"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(100);
    });

    it("should withdraw from campaign where only timeGoal is reached", async function () {
      await Donation.newCampaign(...campaignArgs);

      // making to have some funds (not full goal)
      await Donation.connect(alice).donate(0, { value: parseEther("10") });
      await expect(Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

      // setting SC timestamp to be 20s after the campaign deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 20]);
      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(Donation.withdraw(0)).to.emit(Donation, "FundsWithdrawn").withArgs(0, parseEther("10"));
      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(10);
    });
  });
});
