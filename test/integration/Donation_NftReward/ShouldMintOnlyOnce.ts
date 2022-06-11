import { expect } from "chai";

export const shouldMintOnlyOnce = (): void => {
  const campaignId: number = 0;
  const firstNftId: number = 0;

  it("should only mint the first time a wallet makes a donation", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).donate(campaignId, { value: 1 });

    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1); // alice received 1 nft after first donation
    expect(await this.Nft.ownerOf(firstNftId)).to.equal(this.alice.address);

    await this.Donation.connect(this.alice).donate(campaignId, { value: 1 });
    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1); // alice still only owns one nft after second donation
  });
};
