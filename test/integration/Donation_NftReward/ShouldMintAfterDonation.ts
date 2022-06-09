import { expect } from "chai";

export const shouldMintAfterDonation = (): void => {
  it("should mint nft upon donating to a campaign for the first time", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    await this.Donation.connect(this.alice).donate(0, { value: 1 });

    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(1);
  });
};
