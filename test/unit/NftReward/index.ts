import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("NftReward contract", function () {
  let NftFactory: ContractFactory;
  let Nft: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  const urlPlaceholder = "https://example.com/thanks";

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    NftFactory = await ethers.getContractFactory("NftReward");

    Nft = await NftFactory.connect(owner).deploy();
  });

  describe("Unit tests", async () => {
    it("should display token metadata", async function () {
      expect(await Nft.name()).to.equal("Thanks4Donating");
      expect(await Nft.symbol()).to.equal("TNX4D");
    });

    it("should display deployer as the contract owner", async function () {
      expect(await Nft.owner()).to.equal(owner.address);
    });

    it("should transfer ownership", async function () {
      expect(await Nft.transferOwnership(alice.address))
        .to.emit(Nft, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);

      expect(await Nft.owner()).to.equal(alice.address);
    });

    it("should renounce ownership", async function () {
      expect(await Nft.renounceOwnership())
        .to.emit(Nft, "OwnershipTransferred")
        .withArgs(owner.address, ethers.constants.AddressZero);

      expect(await Nft.owner()).to.equal(ethers.constants.AddressZero);
    });

    it("Should mint nft to an account", async function () {
      await Nft.awardItem(alice.address, urlPlaceholder);
      expect(await Nft.balanceOf(alice.address)).to.equal(1);
      expect(await Nft.ownerOf(0)).to.equal(alice.address);
    });

    it("should transfer nft from one account to another", async function () {
      await Nft.awardItem(alice.address, urlPlaceholder);
      expect(await Nft.connect(alice)["safeTransferFrom(address,address,uint256)"](alice.address, bob.address, 0))
        .to.emit(Nft, "Transfer")
        .withArgs(alice.address, bob.address, 0);

      expect(await Nft.balanceOf(alice.address)).to.equal(0);
      expect(await Nft.balanceOf(bob.address)).to.equal(1);
      expect(await Nft.ownerOf(0)).to.equal(bob.address);
    });

    it("should revert minting done by non-owner accounts", async function () {
      await expect(Nft.connect(alice).awardItem(alice.address, urlPlaceholder)).to.be.reverted;
    });

    it("should revert minting to an account more than once", async function () {
      await Nft.awardItem(alice.address, urlPlaceholder);
      await expect(Nft.awardItem(alice.address, urlPlaceholder + "2")).to.be.revertedWith("NoMultipleMinting");
    });
  });
});
