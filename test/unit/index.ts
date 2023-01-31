import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";

describe("Donation contract", function () {
  let DonationFactory: ContractFactory;
  let Donation: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    DonationFactory = await ethers.getContractFactory("Donation");

    Donation = await DonationFactory.connect(owner).deploy();
  });

  describe("Unit tests", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await Donation.owner()).to.be.equal(owner.address);
    });
    const dayInSeconds: number = 86400; // a day in seconds
    const currentTimestamp: number = Math.round(new Date().getTime() / 1000) + 2; // TODO why do I have to add 2 seconds to this
    const deadline: number = currentTimestamp + 2 * dayInSeconds; // campaign lasts 2 days from now

    // ---------------
    it("Should create campaign", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]); // setting SC timestamp to accurate one
      expect((await Donation.campaigns(0)).registered).to.equal(false);

      const tx: ContractTransaction = await Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );
      const campaign1 = await Donation.campaigns(0);

      expect(tx)
        .to.emit(Donation, "NewCampaign")
        .withArgs("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));
      expect(campaign1.name).to.be.equal("Save the planet");
      expect(campaign1.description).to.be.equal("Description for save the planet");
      expect(campaign1.timeGoal).to.be.equal(deadline).and.to.be.above(currentTimestamp);
      expect(campaign1.moneyGoal).to.be.equal(BigInt(100 * 10 ** 18));
      expect(campaign1.registered).to.equal(true);
      expect(campaign1.complete).to.equal(false);
    });

    // ---------------
    it("Should revert empty strings", async function () {
      await expect(
        Donation.newCampaign("", "Description for save the planet", deadline, BigInt(100 * 10 ** 18)),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(Donation.newCampaign("Some string", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith(
        "NoEmptyStrings",
      );
      await expect(Donation.newCampaign("", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith("NoEmptyStrings");
    });

    // ---------------
    it("should revert 0 moneyGoal", async function () {
      await expect(Donation.newCampaign("Test", "Test", deadline, 0)).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("should accept donation", async function () {
      await Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );

      await expect(Donation.connect(alice).donate(0, { value: 1 }))
        .to.emit(Donation, "NewDonation")
        .withArgs(0, 1);

      await expect(Donation.connect(bob).donate(0, { value: 3 }))
        .to.emit(Donation, "NewDonation")
        .withArgs(0, 3);

      expect(await Donation.campaignBalances(0)).to.equal(4);
    });

    // ---------------
    it("should revert donation with no funds", async function () {
      await Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );

      await expect(Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(Donation.connect(alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("Should revert campaign if timeGoal than is in the past", async function () {
      await expect(
        Donation.newCampaign(
          "Save the planet",
          "Description for save the planet",
          currentTimestamp - 1, // timestamp in the past
          1,
        ),
      ).to.be.revertedWith("InvalidTimeGoal");
    });

    // ---------------
    it("Should revert campaign if moneyGoal is not 1 or above", async function () {
      await expect(
        Donation.newCampaign(
          "title",
          "description",
          deadline, // timestamp in the past
          0,
        ),
      ).to.be.revertedWith("InsufficientAmount");

      await expect(
        Donation.newCampaign(
          "title",
          "description",
          deadline, // timestamp in the past
          1,
        ),
      )
        .to.emit(Donation, "NewCampaign")
        .withArgs("title", "description", deadline, 1);
    });

    // ---------------
    it("should revert withdrawl from incomplete campaign", async function () {
      await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2);
      await Donation.connect(alice).connect(alice).donate(0, { value: 1 });
      await expect(Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    // ---------------
    it("should revert donations to non-existant campaigns", async function () {
      await expect(Donation.connect(alice).donate(5678, { value: 2 })).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert donations when msg.value is 0", async function () {
      await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2000);
      await expect(Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should revert withdrawl from wallets that are not the owners", async function () {
      // did not create a campaign here since the first modifier is 'isOwner'
      await expect(Donation.connect(alice).withdraw(1)).to.be.reverted;
    });

    // ---------------
    it("should withdraw from campaign where only money goal is reached", async function () {
      await Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        utils.parseEther("1000"),
      );
      await Donation.connect(alice).donate(0, { value: parseEther("1000") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(Donation.withdraw(0)).to.emit(Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });

    // ---------------
    it("should withdraw from campaign where only timeGoal is reached", async function () {
      await Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        utils.parseEther("5000"),
      );

      // making to have some funds (not full goal)
      await Donation.connect(alice).donate(0, { value: parseEther("1000") });
      await expect(Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

      // setting SC timestamp to be 20s after the campaign deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 20]);

      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(Donation.withdraw(0)).to.emit(Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });
  });
});
