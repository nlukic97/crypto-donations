import { expect } from "chai";

export const shouldRevertPastTimeGoal = (): void => {
  it("Should revert campaign if timeGoal than is in the past", async function () {
    await expect(this.Donation.newCampaign("title", "description", this.currentTimestamp - 1, 1)).to.be.revertedWith(
      "InvalidTimeGoal",
    );
  });
};
