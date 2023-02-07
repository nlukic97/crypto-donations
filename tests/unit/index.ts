import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { ContractFactory, ContractTransaction, utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// todo check this later
// eslint-disable-next-line node/no-missing-import
import { Donation, NftReward } from "../../typechain";

const dayInSeconds = 86400;

async function getLastBlockTimestamp() {
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  return blockBefore.timestamp;
}

const campaignArgs = Object.values({
  title: "Save the planet",
  description: "Description for save the planet",
  deadlineInDays: 1,
  moneyGoal: 2000,
});

describe("Donation contract", function () {
  this.beforeAll(async function () {
    const [owner, alice, bob, mike]: SignerWithAddress[] = await ethers.getSigners();

    this.signers = {};

    this.signers.owner = owner;
    this.signers.alice = alice;
    this.signers.bob = bob;
    this.signers.mike = mike;
  });

  let DonationFactory: ContractFactory;

  beforeEach(async function () {
    // arrow function so that this.signers.owner could be used
    const deployContracts = async () => {
      /* 1. Deploy NftReward contract */
      const NftRewardFactory = await ethers.getContractFactory("NftReward");
      const NftReward: NftReward = (await NftRewardFactory.connect(this.signers.owner).deploy()) as NftReward;
      await NftReward.deployed();

      /* 2. Deploy Donation contract */
      const nftRewardAddress = NftReward.address;
      DonationFactory = await ethers.getContractFactory("Donation");
      const Donation: Donation = (await DonationFactory.connect(this.signers.owner).deploy(
        nftRewardAddress,
      )) as Donation;
      await Donation.deployed();

      /* Transfering ownerhsip of the NftReward contract to the Donation contract */
      await NftReward.connect(this.signers.owner).transferOwnership(Donation.address);
      return { Donation, NftReward };
    };

    const { Donation, NftReward } = await loadFixture(deployContracts);

    this.Donation = Donation as Donation;
    this.NftReward = NftReward as NftReward;
  });

  describe("Unit tests", async () => {
    it("Should assign the contract deployer to be the owner of the address", async function () {
      expect(await this.Donation.owner()).to.be.equal(this.signers.owner.address);
    });

    // ---------------
    it("Should create campaign", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      // expect((await this.Donation.campaigns(0)).registered).to.equal(false);

      const tx: ContractTransaction = await this.Donation.connect(this.signers.bob).newCampaign(
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
      // expect(campaign1.complete).to.equal(false);
      expect(campaign1.creator).to.equal(this.signers.bob.address);
    });

    // ---------------
    it("Should revert empty strings", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign("", "Description", deadlineInDays, moneyGoal),
      ).to.be.revertedWith("NoEmptyStrings");

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign("Some string", "", deadlineInDays, moneyGoal),
      ).to.be.revertedWith("NoEmptyStrings");

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign("", "", deadlineInDays, moneyGoal),
      ).to.be.revertedWith("NoEmptyStrings");
    });

    // ---------------
    it("should revert 0 moneyGoal", async function () {
      const deadlineInDays = 1;
      const moneyGoal = 0;

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign("Test", "Test", deadlineInDays, moneyGoal),
      ).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("should accept Donation, update campaign balance, and donate Nfts to donors", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await this.Donation.connect(this.signers.bob).newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        moneyGoal,
      );
      expect(await this.Donation.campaignBalances(0)).to.equal(0);

      // alice making a donation
      expect(await this.NftReward.balanceOf(this.signers.alice.address)).to.be.equal(0);
      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);
      expect(await this.NftReward.balanceOf(this.signers.alice.address)).to.be.equal(1);

      // mike making a donation
      expect(await this.NftReward.balanceOf(this.signers.mike.address)).to.be.equal(0);
      await expect(this.Donation.connect(this.signers.mike).donate(0, { value: 3 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 3);
      expect(await this.NftReward.balanceOf(this.signers.mike.address)).to.be.equal(1);

      // campaign balance
      expect(await this.Donation.campaignBalances(0)).to.equal(4);
      expect(await waffle.provider.getBalance(this.Donation.address)).to.equal(4);
    });

    it("base url should be correct and should increment", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);
      expect(await this.Donation.campaignBalances(0)).to.equal(0);

      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);
      expect(await this.NftReward.tokenURI(0)).to.be.equal("https://example.com/nft/0");

      await expect(this.Donation.connect(this.signers.bob).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);
      expect(await this.NftReward.tokenURI(1)).to.be.equal("https://example.com/nft/1");
    });

    it("should accept two donations from account but only mint one nft", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);
      expect(await this.Donation.campaignBalances(0)).to.equal(0);

      // alice making a donation
      expect(await this.NftReward.balanceOf(this.signers.alice.address)).to.be.equal(0);
      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);
      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 1 }))
        .to.emit(this.Donation, "NewDonation")
        .withArgs(0, 1);

      expect(await this.NftReward.balanceOf(this.signers.alice.address)).to.be.equal(1);
    });

    // ---------------
    it("should revert donation with no funds", async function () {
      const deadlineInDays = 1;
      const moneyGoal = ethers.utils.parseEther("100");

      await this.Donation.connect(this.signers.bob).newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        moneyGoal,
      );

      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
      await expect(this.Donation.connect(this.signers.alice).donate(0, { value: 0 })).to.be.revertedWith(
        "InsufficientAmount",
      );
    });

    // ---------------
    it("Should revert campaign if timeGoal than is 0 days or less", async function () {
      const deadlineInDays = 0;

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign(
          "Save the planet",
          "Description for save the planet",
          deadlineInDays,
          1,
        ),
      ).to.be.revertedWith("InvalidTimeGoal");
    });

    // ---------------
    it("Should revert campaign if moneyGoal is not 1 or above", async function () {
      const deadlineInDays = 1;

      await expect(
        this.Donation.connect(this.signers.bob).newCampaign("title", "description", deadlineInDays, 0),
      ).to.be.revertedWith("InsufficientAmount");

      await expect(this.Donation.connect(this.signers.bob).newCampaign("title", "description", deadlineInDays, 1))
        .to.emit(this.Donation, "NewCampaign")
        .withArgs("title", "description", deadlineInDays, 1);
    });

    // ---------------
    it("should revert withdrawl from incomplete campaign", async function () {
      const deadlineInDays = 1;

      await this.Donation.connect(this.signers.bob).newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        2,
      );
      await this.Donation.connect(this.signers.alice).donate(0, { value: 1 });
      await expect(this.Donation.connect(this.signers.bob).withdraw(0)).to.be.revertedWith("ActiveCampaign");
    });

    // ---------------
    it("should revert donations to non-existant campaigns", async function () {
      await expect(this.Donation.connect(this.signers.alice).donate(5678, { value: 2 })).to.be.revertedWith(
        "NonExistantCampaign",
      );
    });

    // ---------------
    it("should revert wthdrawls from non-existant campaigns", async function () {
      await expect(this.Donation.connect(this.signers.bob).withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
    });

    // ---------------
    it("should revert donations when msg.value is 0", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);
      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    });

    // ---------------
    it("should allow contract owner to lock and unlock campaigns", async function () {
      const contractOwner = this.signers.owner;

      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);

      await expect(this.Donation.connect(this.signers.alice).lockCampaign(0)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );

      await expect(this.Donation.connect(contractOwner).lockCampaign(0))
        .to.emit(this.Donation, "CampaignLocked")
        .withArgs(0);

      await expect(this.Donation.connect(this.signers.alice).unlockCampaign(0)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
      await expect(this.Donation.connect(contractOwner).unlockCampaign(0))
        .to.emit(this.Donation, "CampaignUnlocked")
        .withArgs(0);

      await expect(this.Donation.connect(contractOwner).unlockCampaign(0)).to.be.revertedWith(
        "campaignAlreadyUnlocked",
      );
    });

    // ---------------
    it("should revert donations when campaign is locked", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);
      await this.Donation.connect(this.signers.owner).lockCampaign(0);

      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("CampaignIsLocked");
    });

    // ---------------
    it("should revert withdrawal when campaign is locked", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);
      await this.Donation.lockCampaign(0);
      await expect(this.Donation.connect(this.signers.alice).donate(0)).to.be.revertedWith("CampaignIsLocked");
    });

    it("should revert withdrawl from wallets that is not the campaign creators", async function () {
      await this.Donation.connect(this.signers.bob).newCampaign(...campaignArgs);

      await expect(this.Donation.connect(this.signers.alice).withdraw(0)).to.be.revertedWith("Unauthorized");
    });

    // ---------------
    it("should withdraw from campaign where only money goal is reached", async function () {
      const deadlineInDays = 10;

      await this.Donation.connect(this.signers.bob).newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        utils.parseEther("1000"),
      );
      await this.Donation.connect(this.signers.alice).donate(0, { value: parseEther("1000") }); // making campaign with 0 complete due to achieving moneyGoal

      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));

      await expect(this.Donation.connect(this.signers.bob).withdraw(0))
        .to.emit(this.Donation, "FundsWithdrawn")
        .withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });

    // ---------------
    it("should withdraw from campaign where only timeGoal is reached or higher", async function () {
      const deadlineInDays = 1;

      await this.Donation.connect(this.signers.bob).newCampaign(
        "Save the planet",
        "Description for save the planet",
        deadlineInDays,
        utils.parseEther("5000"),
      );

      // making to have some funds (not full goal)
      await this.Donation.connect(this.signers.alice).donate(0, { value: parseEther("1000") });
      await expect(this.Donation.connect(this.signers.bob).withdraw(0)).to.be.revertedWith("ActiveCampaign");

      const campaign = await this.Donation.campaigns(0);
      const timeGoal = campaign.timeGoal.toNumber();

      // setting block timestamp to campaign timegoal - 1 second, not still active
      await ethers.provider.send("evm_setNextBlockTimestamp", [timeGoal - 1]);
      await expect(this.Donation.connect(this.signers.bob).withdraw(0)).to.revertedWith("ActiveCampaign");

      // setting block timestamp to campaign timegoal, so the campaign is finished
      await ethers.provider.send("evm_setNextBlockTimestamp", [timeGoal]);

      const ownerBeforeBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));

      await expect(this.Donation.connect(this.signers.bob).withdraw(0))
        .to.emit(this.Donation, "FundsWithdrawn")
        .withArgs(0, parseEther("1000"));

      const ownerAfterBalance = parseInt(utils.formatUnits(await this.signers.owner.getBalance(), "ether"));
      const diff = ownerAfterBalance - ownerBeforeBalance;
      expect(diff).to.equal(1000);
    });
  });
});
