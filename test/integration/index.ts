import { ethers, waffle } from "hardhat";
import { IntegrationFixture } from "../shared/fixtures";

// tests
import { shouldMintAfterDonation } from "./Donation_NftReward/ShouldMintAfterDonation";
import { shouldMintOnlyOnce } from "./Donation_NftReward/ShouldMintOnlyOnce";

describe("Integration tests", async function () {
  before(async function () {
    this.dayInSeconds = 86400;
    this.currentTimestamp = Math.round(new Date().getTime() / 1000);
    this.deadline = this.currentTimestamp + 2 * this.dayInSeconds;

    this.campaignArgs = ["title", "description", this.deadline, ethers.utils.parseEther("1000")];
    this.urlPlaceholder = "https://example.com/thanks";

    const wallets = waffle.provider.getWallets();
    [this.owner, this.alice, this.bob] = wallets;

    this.loadFixture = waffle.createFixtureLoader(wallets);
  });

  beforeEach(async function () {
    const { Donation, Nft } = await this.loadFixture(IntegrationFixture);
    this.Donation = Donation;
    this.Nft = Nft;
  });

  describe("NftReward", async function () {
    shouldMintAfterDonation();
    shouldMintOnlyOnce();
  });
});
