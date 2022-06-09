import { expect } from "chai";

export const shouldDisplayOwner = (): void => {
  it("should display deployer as the contract owner", async function () {
    expect(await this.Nft.owner()).to.equal(this.owner.address);
  });
};
