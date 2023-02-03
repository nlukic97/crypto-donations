import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const dayInSeconds = 86400; // a day in seconds

async function getLastBlockTimestamp() {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
}

describe("Donation contract", function () {
  this.beforeAll(async function () {
    const [owner, alice, bob]: SignerWithAddress[] = await ethers.getSigners();

    this.signers = {};

    this.signers.owner = owner;
    this.signers.alice = alice;
    this.signers.bob = bob;
  });

  let DonationFactory: ContractFactory;

  beforeEach(async function () {
    // async function so that this.signers.owner could be used
    const deployDonationContract = async () => {
      DonationFactory = await ethers.getContractFactory("Donation");
      const Donation: Contract = await DonationFactory.connect(this.signers.owner).deploy();
      await Donation.deployed();
      return { Donation };
    };

    const { Donation } = await loadFixture(deployDonationContract);

    this.Donation = Donation;
  });

  describe("Unit tests", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await this.Donation.owner()).to.be.equal(this.signers.owner.address);
    });

    // ---------------
    it("Should create campaign", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      // await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]); // setting SC timestamp to accurate one
      expect((await this.Donation.campaigns(0)).registered).to.equal(false);

      const tx: ContractTransaction = await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        moneyGoal,
      );
      const campaign1 = await this.Donation.campaigns(0);

      // getting the deadline which should be present
      const lastBlockTimestamp = await getLastBlockTimestamp();
      const expectedDeadline = lastBlockTimestamp + deadlineInDays * dayInSeconds;

      expect(tx)
        .to.emit(this.Donation, "NewCampaign")
        .withArgs("Save the planet", "Description for save the planet", deadlineInDays, moneyGoal);
      expect(campaign1.name).to.be.equal("Save the planet");
      expect(campaign1.description).to.be.equal("Description for save the planet");
      expect(campaign1.timeGoal).to.be.equal(expectedDeadline);
      expect(campaign1.timeGoal).to.be.above(lastBlockTimestamp);
      expect(campaign1.moneyGoal).to.be.equal(ethers.utils.parseEther("100"));
      expect(campaign1.registered).to.equal(true);
      expect(campaign1.complete).to.equal(false);
    });

    // ---------------
    it("Should revert empty strings", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await expect(
        this.Donation.newCampaign("", "Description for save the planet", deadlineInDays, moneyGoal),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(this.Donation.newCampaign("Some string", "", deadlineInDays, moneyGoal)).to.be.revertedWith(
        "NoEmptyStrings",
      );
      await expect(this.Donation.newCampaign("", "", deadlineInDays, moneyGoal)).to.be.revertedWith("NoEmptyStrings");
    });

    // ---------------
    it("should revert 0 moneyGoal", async function () {
      const deadlineInDays = 1;

      await expect(this.Donation.newCampaign("Test", "Test", deadlineInDays, 0)).to.be.revertedWith(
        "InsufficientAmount",
      );
    });

    // ---------------
    it("should accept Donation", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadlineInDays, moneyGoal);

      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);

      await expect(this.Donation.connect(this.signers.bob).donate(0, { value: 3 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 3);

      expect(await this.Donation.campaignBalances(0)).to.equal(4);
    });

    // ---------------
    it("should revert donation with no funds", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadlineInDays, moneyGoal);

      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 0 })).to.be.revertedWith(
        "InsufficientAmount",
      );
    });

    // ---------------
    it("Should revert campaign if timeGoal than is 0 days or less", async function () {
      const deadlineInDays = 0;

      await expect(
        this.Donation.newCampaign("Save the planet", "Description for save the planet", deadlineInDays, 1),
      ).to.be.revertedWith("InvalidTimeGoal");
    });

    // ---------------
    it("Should revert campaign if moneyGoal is not 1 or above", async function () {
      const deadlineInDays = 1;

      await expect(this.Donation.newCampaign("title", "description", deadlineInDays, 0)).to.be.revertedWith(
        "InsufficientAmount",
      );

      await expect(this.Donation.newCampaign("title", "description", deadlineInDays, 1))
        .to.emit(this.Donation, "NewCampaign")
        .withArgs("title", "description", deadlineInDays, 1);
    });

    // ---------------
    it("should revert withdrawl from incomplete campaign", async function () {
      const deadlineInDays = 1;

      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadlineInDays, 2);
      await this.Donation.connect(this.signers.alice).donate(0, { value: 1 });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    // ---------------
    it("should revert donations to non-existant campaigns", async function () {
      await expect(this.Donation.connect(this.signers.alice).donate(5678, { value: 2 })).to.be.revertedWith(
        "NonExistantCampaign",
      );
    });

    // ---------------
    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(this.Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert donations when msg.value is 0", async function () {
      const deadlineInDays = 1;

      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadlineInDays, 2000);
      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should revert withdrawl from wallets that are not the owners", async function () {
      // did not create a campaign here since the first modifier is 'isOwner'
      await expect(this.Donation.connect(this.signers.alice).withdraw(1)).to.be.reverted;
    });

    // ---------------
    it("should withdraw from campaign where only money goal is reached", async function () {
      const deadlineInDays = 10;

      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        utils.parseEther("1000"),
      );
      await this.Donation.connect(this.signers.alice).donate(0, { value: parseEther("1000") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });

    // ---------------
    it("should withdraw from campaign where only timeGoal is reached or higher", async function () {
      const deadlineInDays = 1;

      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        utils.parseEther("5000"),
      );

      // making to have some funds (not full goal)
      await this.Donation.connect(this.signers.alice).donate(0, { value: parseEther("1000") });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

      const campaign = await this.Donation.campaigns(0);
      const timeGoal = campaign.timeGoal.toNumber();

      // setting block timestamp to campaign timegoal - 1 second, not still active
      await ethers.provider.send("evm_setNextBlockTimestamp", [timeGoal - 1]);
      await expect(this.Donation.withdraw(0)).to.revertedWith("ActiveCampaign");

      // setting block timestamp to campaign timegoal, so the campaign is finished
      await ethers.provider.send("evm_setNextBlockTimestamp", [timeGoal]);

      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });
  });
});
