import { expect } from "chai";

export const shouldRevertInvalidTimeGoal = (): void => {
  const days: number = 2;
  const moneyGoal: number = 1;

  it("Should revert campaign if timeGoal is 0 or less", async function () {
    await expect(this.Donation.newCampaign("title", "description", 0, moneyGoal)).to.be.revertedWith("InvalidTimeGoal");
    expect(this.Donation.newCampaign("title", "description", -1, moneyGoal)).to.be.throw;
  });
};
