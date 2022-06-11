import { waffle } from "hardhat";
import { unitNftFixture } from "../../shared/fixtures";

// tests:
import { shouldDisplayMetaData } from "./NftReward/NftRewardShouldDisplayMeta";
import { shouldDisplayOwner } from "./NftReward/NftRewardShouldDisplayOwner";
import { shouldTransferOwnership } from "./NftReward/NftRewardShouldTransferOwnership";
import { shouldRenounceOwnership } from "./NftReward/NftRewardShouldRenounceOwnership";
import { shouldMint } from "./NftReward/NftRewardShouldMint";
import { shouldTransferNft } from "./NftReward/NftRewardShouldTransferNft";
import { shouldRevertMint } from "./NftReward/NftRewardShouldRevertMint";
import { shouldRevertMultipleMinting } from "./NftReward/NftRewardShouldRevertMultipleMinting";

describe("Unit tests", function () {
  before(async function () {
    const wallets = waffle.provider.getWallets();

    [this.owner, this.alice, this.bob] = wallets;

    this.loadFixture = waffle.createFixtureLoader(wallets);
  });

  beforeEach(async function () {
    const { Nft } = await this.loadFixture(unitNftFixture);
    this.Nft = Nft;
  });

  describe("NftReward contract", async () => {
    shouldDisplayMetaData();
    shouldDisplayOwner();
    shouldTransferOwnership();
    shouldRenounceOwnership();
    shouldMint();
    shouldTransferNft();
    shouldRevertMint();
    shouldRevertMultipleMinting();
  });
});
