import { expect } from "chai";

export const shouldRevertZeroMoneyGoal = (): void => {
  it("Should revert campaign if moneyGoal is not 1 or above", async function () {
    await expect(this.Donation.newCampaign("title", "description", this.deadline, 0)).to.be.revertedWith(
      "InsufficientAmount",
    );

    await expect(this.Donation.newCampaign(...this.campaignArgs))
      .to.emit(this.Donation, "NewCampaign")
      .withArgs(...this.campaignArgs);
  });
};
