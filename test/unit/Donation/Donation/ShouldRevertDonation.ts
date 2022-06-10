import { expect } from "chai";

export const shouldRevertDonation = (): void => {
  // when I put all these It's in a Context block, I get an invalid time goal error.
  it("should revert donations to non-existant campaigns", async function () {
    const nonExistantId: number = 5678;
    await expect(this.Donation.connect(this.alice).donate(nonExistantId, { value: 2 })).to.be.revertedWith(
      "NonExistantCampaign",
    );
  });

  it("should revert donation with no funds", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await expect(this.Donation.connect(this.alice).donate(0, { value: 0 })).to.be.revertedWith("InsufficientAmount");
  });
};
