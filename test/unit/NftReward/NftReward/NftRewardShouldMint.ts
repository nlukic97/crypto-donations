import { expect } from "chai";

export const shouldMint = (): void => {
  it("Should mint nft to an account", async function () {
    await this.Nft.awardItem(this.alice.address, this.urlPlaceholder);
    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1);
    expect(await this.Nft.ownerOf(0)).to.equal(this.alice.address);
  });
};
