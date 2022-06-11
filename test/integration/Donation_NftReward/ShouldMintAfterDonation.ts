import { expect } from "chai";
import { nftURL } from "../../shared/constants";

export const shouldMintAfterDonation = (): void => {
  const campaignId: number = 0;
  const amount: number = 1;
  const firstNftId: number = 0;

  it("should mint nft upon donating to a campaign for the first time", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    await this.Donation.connect(this.alice).donate(campaignId, { value: amount });

    expect(await this.Nft.balanceOf(this.alice.address)).to.equal(amount);
    expect(await this.Nft.ownerOf(firstNftId)).to.equal(this.alice.address);
    expect(await this.Nft.tokenURI(firstNftId)).to.equal(nftURL);
  });
};
