import { expect } from "chai";

export const shouldTransferNft = (): void => {
  it("should transfer nft from one account to another", async function () {
    await this.Nft.awardItem(this.alice.address, this.urlPlaceholder);

    expect(
      await this.Nft.connect(this.alice)["safeTransferFrom(address,address,uint256)"](
        this.alice.address,
        this.bob.address,
        0,
      ),
    )
      .to.emit(this.Nft, "Transfer")
      .withArgs(this.alice.address, this.bob.address, 0);

    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(0);
    expect(await this.Nft.balanceOf(this.bob.address)).to.equal(1);
    expect(await this.Nft.ownerOf(0)).to.equal(this.bob.address);
  });
};
