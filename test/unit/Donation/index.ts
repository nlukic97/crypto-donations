import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";

describe("Unit tests", function () {
  before(async function () {
    [this.owner, this.alice, this.bob] = await ethers.getSigners();

    this.dayInSeconds = 86400;
    this.currentTimestamp = Math.round(new Date().getTime() / 1000);
    this.deadline = this.currentTimestamp + 2 * this.dayInSeconds;

    this.campaignArgs = ["title", "description", this.deadline, ethers.utils.parseEther("100")];
    this.urlPlaceholder = "https://example.com/thanks";
  });

  beforeEach(async function () {
    const NftFactory: ContractFactory = await ethers.getContractFactory("NftReward");
    this.Nft = await NftFactory.connect(this.owner).deploy();

    const DonationFactory: ContractFactory = await ethers.getContractFactory("Donation");
    this.Donation = await DonationFactory.connect(this.owner).deploy();

    await this.Donation.setNftAddress(this.Nft.address);
    await this.Nft.transferOwnership(this.Donation.address); // so only the Donation SC can mint new NFT's
  });

  describe("Donation contract", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await this.Donation.owner()).to.be.equal(this.owner.address);
    });

    it("Should create campaign", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [this.currentTimestamp]); // setting SC timestamp to accurate one
      expect((await this.Donation.campaigns(0)).registered).to.equal(false);

      await expect(this.Donation.newCampaign(...this.campaignArgs))
        .to.emit(this.Donation, "NewCampaign")
        .withArgs(...this.campaignArgs);

      const campaign1 = await this.Donation.campaigns(0);

      expect(campaign1.name).to.be.equal("title");
      expect(campaign1.description).to.be.equal("description");
      expect(campaign1.timeGoal).to.be.equal(this.deadline).and.to.be.above(this.currentTimestamp);
      expect(campaign1.moneyGoal).to.be.equal(ethers.utils.parseEther("100"));
      expect(campaign1.registered).to.equal(true);
      expect(campaign1.complete).to.equal(false);
    });

    it("Should revert empty strings", async function () {
      await expect(
        this.Donation.newCampaign("", "Description", this.deadline, ethers.utils.parseEther("100")),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(
        this.Donation.newCampaign("title", "", this.deadline, ethers.utils.parseEther("100")),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(this.Donation.newCampaign("", "", this.deadline, ethers.utils.parseEther("100"))).to.be.revertedWith(
        "NoEmptyStrings",
      );
    });

    it("should revert 0 moneyGoal", async function () {
      await expect(this.Donation.newCampaign("title", "description", this.deadline, 0)).to.be.revertedWith(
        "InsufficientAmount",
      );
    });

    it("should accept donation", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);

      expect(await this.Donation._donated(this.alice.address)).to.equal(false);
      await expect(this.Donation.connect(this.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);
      expect(await this.Donation._donated(this.alice.address)).to.equal(true);

      expect(await this.Donation._donated(this.bob.address)).to.equal(false);
      await expect(this.Donation.connect(this.bob).donate(0, { value: 3 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 3);
      expect(await this.Donation._donated(this.bob.address)).to.equal(true);

      expect(await this.Donation.campaignBalances(0)).to.equal(4);
    });

    it("should revert donation with no funds", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);

      await expect(this.Donation.connect(this.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(this.Donation.connect(this.alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
    });

    it("Should revert campaign if timeGoal than is in the past", async function () {
      await expect(this.Donation.newCampaign("title", "description", this.currentTimestamp - 1, 1)).to.be.revertedWith(
        "InvalidTimeGoal",
      );
    });

    it("Should revert campaign if moneyGoal is not 1 or above", async function () {
      await expect(this.Donation.newCampaign("title", "description", this.deadline, 0)).to.be.revertedWith(
        "InsufficientAmount",
      );

      await expect(this.Donation.newCampaign(...this.campaignArgs))
        .to.emit(this.Donation, "NewCampaign")
        .withArgs(...this.campaignArgs);
    });

    it("should revert withdrawl from incomplete campaign", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);
      await this.Donation.connect(this.alice).connect(this.alice).donate(0, { value: 1 });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    it("should revert donations to non-existant campaigns", async function () {
      await expect(this.Donation.connect(this.alice).donate(5678, { value: 2 })).to.be.revertedWith(
        "NonExistantCampaign",
      );
    });

    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(this.Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    it("should revert donations when msg.value is 0", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);
      await expect(this.Donation.connect(this.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should revert withdrawl from wallets that are not the owners", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);
      await this.Donation.connect(this.alice).donate(0, { value: 1 });
      await expect(this.Donation.connect(this.alice).withdraw(1)).to.be.reverted;
    });

    it("should return excess Eth to user who sent more than necessary to complete campaign", async function () {
      await this.Donation.newCampaign(...this.campaignArgs); // goal is 100 eth
      const initialBalance = this.alice.getBalance();
      await this.Donation.connect(this.alice).donate(0, { value: ethers.utils.parseEther("1000") }); // payee pays 1000 eth, 100eth should be taken and 900ethshould be returned

      const currentBalance = await this.alice.getBalance();
      const diff = currentBalance.sub(await initialBalance);
      expect(parseInt(ethers.utils.formatEther(diff))).to.equal(-100); // ... making a difference in balance of around -100 eth after
    });

    it("should withdraw from campaign where only money goal is reached", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);
      await this.Donation.connect(this.alice).donate(0, { value: parseEther("100") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("100"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await this.owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(100);
    });

    it("should withdraw from campaign where only timeGoal is reached", async function () {
      await this.Donation.newCampaign(...this.campaignArgs);

      // making to have some funds (not full goal)
      await this.Donation.connect(this.alice).donate(0, { value: parseEther("10") });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

      // setting SC timestamp to be 20s after the campaign deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [this.deadline + 20]);
      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("10"));
      const ownerAfterBalance = parseInt(utils.formatUnits(await this.owner.getBalance(), "ether"));

      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(10);
    });
  });
});
