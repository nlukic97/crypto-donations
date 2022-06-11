import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";

export const shouldRevertEmptyStrings = (): void => {
  const days: number = 2;
  const moneyGoal: BigNumberish = ethers.utils.parseEther("100");

  it("Should revert empty strings", async function () {
    await expect(this.Donation.newCampaign("", "Description", days, moneyGoal)).to.be.revertedWith("NoEmptyStrings");

    await expect(this.Donation.newCampaign("title", "", days, moneyGoal)).to.be.revertedWith("NoEmptyStrings");

    await expect(this.Donation.newCampaign("", "", days, moneyGoal)).to.be.revertedWith("NoEmptyStrings");
  });
};
