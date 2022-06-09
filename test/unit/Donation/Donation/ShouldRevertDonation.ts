import { expect } from "chai";

export const shouldRevertDonation = (): void => {
  // when I put all these It's in a Context block, I get an invalid time goal error.
  it("should revert donations to non-existant campaigns", async function () {
    await expect(this.Donation.connect(this.alice).donate(5678, { value: 2 })).to.be.revertedWith(
      "NonExistantCampaign",
    );
  });

  it("should revert donations when msg.value is 0", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await expect(this.Donation.connect(this.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
  });

  it("should revert donation with no funds", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    await expect(this.Donation.connect(this.alice).donate(0)).to.be.revertedWith("InsufficientAmount");
    await expect(this.Donation.connect(this.alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
  });
};
