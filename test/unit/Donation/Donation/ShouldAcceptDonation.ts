import { expect } from "chai";

export const shouldAcceptDonation = (): void => {
  it("should accept donation", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    expect(await this.Donation._donated(this.alice.address)).to.equal(false);
    await expect(this.Donation.connect(this.alice).donate(0, { value: 1 }))
      .to.emit(this.Donation, "NewDonation")
      .withArgs(0, 1);
    expect(await this.Donation._donated(this.alice.address)).to.equal(true);

    expect(await this.Donation._donated(this.bob.address)).to.equal(false);
    await expect(this.Donation.connect(this.bob).donate(0, { value: 3 }))
      .to.emit(this.Donation, "NewDonation")
      .withArgs(0, 3);
    expect(await this.Donation._donated(this.bob.address)).to.equal(true);

    expect(await this.Donation.campaignBalances(0)).to.equal(4);
  });
};
