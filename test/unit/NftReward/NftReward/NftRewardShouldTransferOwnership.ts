import { expect } from "chai";

export const shouldTransferOwnership = (): void => {
  it("should transfer ownership", async function () {
    expect(await this.Nft.transferOwnership(this.alice.address))
      .to.emit(this.Nft, "OwnershipTransferred")
      .withArgs(this.owner.address, this.alice.address);

    expect(await this.Nft.owner()).to.equal(this.alice.address);
  });
};
