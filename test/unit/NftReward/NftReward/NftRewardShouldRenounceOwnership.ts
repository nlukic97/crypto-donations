import { expect } from "chai";
import { ethers } from "hardhat";

export const shouldRenounceOwnership = (): void => {
  it("should renounce ownership", async function () {
    expect(await this.Nft.renounceOwnership())
      .to.emit(this.Nft, "OwnershipTransferred")
      .withArgs(this.owner.address, ethers.constants.AddressZero);

    expect(await this.Nft.owner()).to.equal(ethers.constants.AddressZero);
  });
};
