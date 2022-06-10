import { expect } from "chai";

export const shouldRevertMint = (): void => {
  it("should revert minting done by non-owner accounts", async function () {
    await expect(this.Nft.connect(this.alice).awardItem(this.alice.address, this.urlPlaceholder)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
  });
};
