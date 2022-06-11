import { expect } from "chai";
import { nftURL } from "../../../shared/constants";

export const shouldRevertMultipleMinting = (): void => {
  it("should revert minting to an account more than once", async function () {
    await this.Nft.awardItem(this.alice.address, nftURL);
    await expect(this.Nft.awardItem(this.alice.address, nftURL)).to.be.revertedWith("NoMultipleMinting");
  });
};
