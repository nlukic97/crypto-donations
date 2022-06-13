import { ethers, waffle } from "hardhat";
import { unitDonationFixture } from "../../shared/fixtures";

// tests
import { shouldBeCorrectOwner } from "./Donation/ShouldBeCorrectOwner";
import { shouldCreateCampaign } from "./Donation/ShouldCreateCampaign";
import { shouldRevertEmptyStrings } from "./Donation/ShouldRevertEmptyStrings";
import { shouldRevertZeroMoneyGoal } from "./Donation/ShouldRevertZeroMoneyGoal";
import { shouldAcceptDonation } from "./Donation/ShouldAcceptDonation";
import { shouldRevertInvalidTimeGoal } from "./Donation/ShouldRevertInvalidTimeGoal";
import { shouldRevertDonation } from "./Donation/ShouldRevertDonation";
import { shouldRevertWithdraw } from "./Donation/ShouldRevertWithdraw";
import { shouldReturnExcessEth } from "./Donation/ShouldReturnExcessEth";
import { shouldWithdraw } from "./Donation/ShouldWithdraw";

describe("Unit tests", function () {
  before(async function () {
    this.dayInSeconds = 86400;

    const wallets = waffle.provider.getWallets();
    [this.owner, this.alice, this.bob] = wallets;

    // setting SC timestamp to accurate one
    this.loadFixture = waffle.createFixtureLoader(wallets);
  });

  beforeEach(async function () {
    const { Donation } = await this.loadFixture(unitDonationFixture);
    this.Donation = Donation;
  });

  describe("Donation contract", async () => {
    shouldBeCorrectOwner();
    shouldCreateCampaign();
    shouldRevertEmptyStrings();
    shouldRevertZeroMoneyGoal();
    shouldRevertInvalidTimeGoal();
    shouldAcceptDonation();
    shouldRevertDonation();
    shouldRevertWithdraw();
    shouldReturnExcessEth();
    shouldWithdraw();
  });
});
