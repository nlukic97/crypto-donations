import { expect } from "chai";

export const shouldMintOnlyOnce = (): void => {
  it("should only mint the first time a wallet makes a donation", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).donate(0, { value: 1 });
    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1);

    await this.Donation.connect(this.alice).donate(0, { value: 1 });
    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1); // still only owns one nft after donating twice
    expect(await this.Nft.ownerOf(0)).to.equal(this.alice.address);
  });
};
