import { expect } from "chai";

export const shouldAcceptDonation = (): void => {
  const amount1: number = 1;
  const amount2: number = 3;

  it("should accept donation", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    expect(await this.Donation._donated(this.alice.address)).to.equal(false);
    await expect(this.Donation.connect(this.alice).donate(0, { value: amount1 }))
      .to.emit(this.Donation, "NewDonation")
      .withArgs(0, amount1);
    expect(await this.Donation._donated(this.alice.address)).to.equal(true);

    expect(await this.Donation._donated(this.bob.address)).to.equal(false);
    await expect(this.Donation.connect(this.bob).donate(0, { value: amount2 }))
      .to.emit(this.Donation, "NewDonation")
      .withArgs(0, amount2);
    expect(await this.Donation._donated(this.bob.address)).to.equal(true);

    expect(await this.Donation.campaignBalances(0)).to.equal(amount1 + amount2);
  });
};
