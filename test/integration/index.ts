import { ethers } from "hardhat";
import { ContractFactory } from "ethers";

// tests
import { shouldMintAfterDonation } from "./Donation_NftReward/ShouldMintAfterDonation";
import { shouldMintOnlyOnce } from "./Donation_NftReward/ShouldMintOnlyOnce";

describe("Integration tests", async function () {
  before(async function () {
    [this.owner, this.alice, this.bob] = await ethers.getSigners();

    this.dayInSeconds = 86400;
    this.currentTimestamp = Math.round(new Date().getTime() / 1000);
    this.deadline = this.currentTimestamp + 2 * this.dayInSeconds;

    this.campaignArgs = ["title", "description", this.deadline, ethers.utils.parseEther("1000")];
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

  describe("NftReward", async function () {
    shouldMintAfterDonation();
    shouldMintOnlyOnce();
  });
});
