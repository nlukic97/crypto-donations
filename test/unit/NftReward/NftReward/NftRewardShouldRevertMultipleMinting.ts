import { expect } from "chai";

export const shouldRevertMultipleMinting = (): void => {
  it("should revert minting to an account more than once", async function () {
    await this.Nft.awardItem(this.alice.address, this.urlPlaceholder);
    await expect(this.Nft.awardItem(this.alice.address, this.urlPlaceholder + "2")).to.be.revertedWith(
      "NoMultipleMinting",
    );
  });
};
