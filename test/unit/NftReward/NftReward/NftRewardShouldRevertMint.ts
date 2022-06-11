import { expect } from "chai";
import { nftURL } from "../../../shared/constants";

export const shouldRevertMint = (): void => {
  it("should revert minting done by non-owner accounts", async function () {
    await expect(this.Nft.connect(this.alice).awardItem(this.alice.address, nftURL)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
  });
};
