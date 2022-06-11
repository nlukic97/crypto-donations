import { expect } from "chai";
import { nftURL } from "../../../shared/constants";

export const shouldMint = (): void => {
  it("Should mint nft to an account", async function () {
    await this.Nft.awardItem(this.alice.address, nftURL);

    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1);
    expect(await this.Nft.ownerOf(0)).to.equal(this.alice.address);
    expect(await this.Nft.tokenURI(0)).to.equal(nftURL);
  });
};
