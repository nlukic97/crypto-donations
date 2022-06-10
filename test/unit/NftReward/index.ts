import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { NftFixture } from "../../shared/fixtures";

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
    this.urlPlaceholder = "https://example.com/thanks";

    [this.owner, this.alice, this.bob] = await ethers.getSigners();
    const wallets = [this.owner, this.alice, this.bob];

    this.loadFixture = waffle.createFixtureLoader(wallets);
  });

  beforeEach(async function () {
    /* const NftFactory: ContractFactory = await ethers.getContractFactory("NftReward");

    const Nft: Contract = await NftFactory.connect(this.owner).deploy();

    this.Nft = Nft; */
    const Nft = this.loadFixture(NftFixture);
    this.Nft = Nft;
  });

  describe("NftReward contract", async () => {
    shouldDisplayMetaData();
    /*     shouldDisplayOwner();
    shouldTransferOwnership();
    shouldRenounceOwnership();
    shouldMint();
    shouldTransferNft();
    shouldRevertMint();
    shouldRevertMultipleMinting(); */
  });
});
