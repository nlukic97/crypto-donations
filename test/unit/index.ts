import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const dayInSeconds = 86400; // a day in seconds
const currentTimestamp: number = Math.round(new Date().getTime() / 1000) + 2; // TODO why do I have to add 2 seconds to this
const deadline: number = currentTimestamp + 2 * dayInSeconds; // campaign lasts 2 days from now

describe("Donation contract", function () {
  let DonationFactory: ContractFactory;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const deployDonationContract = async function () {
      DonationFactory = await ethers.getContractFactory("Donation");
      const Donation: Contract = await DonationFactory.connect(owner).deploy();
      await Donation.deployed();
      return { Donation };
    };

    const { Donation } = await loadFixture(deployDonationContract);

    this.Donation = Donation;
  });

  describe("Unit tests", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await this.Donation.owner()).to.be.equal(owner.address);
    });

    // ---------------
    it("Should create campaign", async function () {
      await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]); // setting SC timestamp to accurate one
      expect((await this.Donation.campaigns(0)).registered).to.equal(false);

      const tx: ContractTransaction = await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );
      const campaign1 = await this.Donation.campaigns(0);

      expect(tx)
        .to.emit(this.Donation, "NewCampaign")
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
        this.Donation.newCampaign("", "Description for save the planet", deadline, BigInt(100 * 10 ** 18)),
      ).to.be.revertedWith("NoEmptyStrings");
      await expect(this.Donation.newCampaign("Some string", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith(
        "NoEmptyStrings",
      );
      await expect(this.Donation.newCampaign("", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith(
        "NoEmptyStrings",
      );
    });

    // ---------------
    it("should revert 0 moneyGoal", async function () {
      await expect(this.Donation.newCampaign("Test", "Test", deadline, 0)).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("should accept Donation", async function () {
      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );

      await expect(this.Donation.connect(alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);

      await expect(this.Donation.connect(bob).donate(0, { value: 3 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 3);

      expect(await this.Donation.campaignBalances(0)).to.equal(4);
    });

    // ---------------
    it("should revert donation with no funds", async function () {
      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        BigInt(100 * 10 ** 18),
      );

      await expect(this.Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(this.Donation.connect(alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("Should revert campaign if timeGoal than is in the past", async function () {
      await expect(
        this.Donation.newCampaign(
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
        this.Donation.newCampaign(
          "title",
          "description",
          deadline, // timestamp in the past
          0,
        ),
      ).to.be.revertedWith("InsufficientAmount");

      await expect(
        this.Donation.newCampaign(
          "title",
          "description",
          deadline, // timestamp in the past
          1,
        ),
      )
        .to.emit(this.Donation, "NewCampaign")
        .withArgs("title", "description", deadline, 1);
    });

    // ---------------
    it("should revert withdrawl from incomplete campaign", async function () {
      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2);
      await this.Donation.connect(alice).connect(alice).donate(0, { value: 1 });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    // ---------------
    it("should revert donations to non-existant campaigns", async function () {
      await expect(this.Donation.connect(alice).donate(5678, { value: 2 })).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(this.Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert donations when msg.value is 0", async function () {
      await this.Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2000);
      await expect(this.Donation.connect(alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    it("should revert withdrawl from wallets that are not the owners", async function () {
      // did not create a campaign here since the first modifier is 'isOwner'
      await expect(this.Donation.connect(alice).withdraw(1)).to.be.reverted;
    });

    // ---------------
    it("should withdraw from campaign where only money goal is reached", async function () {
      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        utils.parseEther("1000"),
      );
      await this.Donation.connect(alice).donate(0, { value: parseEther("1000") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });

    // ---------------
    it("should withdraw from campaign where only timeGoal is reached", async function () {
      await this.Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadline,
        utils.parseEther("5000"),
      );

      // making to have some funds (not full goal)
      await this.Donation.connect(alice).donate(0, { value: parseEther("1000") });
      await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

      // setting SC timestamp to be 20s after the campaign deadline
      await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 20]);

      const ownerBeforeBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));

      await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });
  });
});
