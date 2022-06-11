import { expect } from "chai";

export const shouldRevertZeroMoneyGoal = (): void => {
  const days: number = 2;
  const moneyGoal: number = 0;

  it("Should revert campaign if moneyGoal is not 1 or above", async function () {
    await expect(this.Donation.newCampaign("title", "description", days, moneyGoal)).to.be.revertedWith(
      "InsufficientAmount",
    );
  });
};
