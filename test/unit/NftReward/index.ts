import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

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
    [this.owner, this.alice, this.bob] = await ethers.getSigners();
    this.urlPlaceholder = "https://example.com/thanks";
  });

  beforeEach(async function () {
    const NftFactory: ContractFactory = await ethers.getContractFactory("NftReward");

    const Nft: Contract = await NftFactory.connect(this.owner).deploy();

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
