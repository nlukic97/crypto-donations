import { ethers, waffle } from "hardhat";
import { IntegrationFixture } from "../shared/fixtures";

// tests
import { shouldMintAfterDonation } from "./Donation_NftReward/ShouldMintAfterDonation";
import { shouldMintOnlyOnce } from "./Donation_NftReward/ShouldMintOnlyOnce";

describe("Integration tests", async function () {
  before(async function () {
    this.dayInSeconds = 86400;
    const days = 10;
    const amount = 100;
    this.campaignArgs = ["title", "description", days, amount];

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
