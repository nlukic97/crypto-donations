import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, formatUnits } from "ethers/lib/utils";

export const shouldWithdraw = (): void => {
  const campaignId = 0;
  const amount1 = ethers.utils.parseEther("100");
  const amount2 = ethers.utils.parseEther("10");

  it("should withdraw from campaign where only money goal is reached", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).donate(campaignId, { value: amount1 }); // making campaign with 0 complete due to achieving moneyGoal

    const ownerBeforeBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(campaignId))
      .to.emit(this.Donation, "FundsWithdrawn")
      .withArgs(campaignId, amount1);

    const ownerAfterBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));
    const diff = ownerAfterBalance - ownerBeforeBalance;
    expect(diff).to.equal(100);
  });

  it("should withdraw from campaign where only timeGoal is reached", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    // making to have some funds (not full goal)
    await this.Donation.connect(this.alice).donate(campaignId, { value: amount2 });
    await expect(this.Donation.withdraw(campaignId)).to.be.revertedWith("ActiveCampaign");

    // setting SC timestamp to be 20s after the campaign deadline
    await ethers.provider.send("evm_setNextBlockTimestamp", [this.deadline + 20]);
    const ownerBeforeBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(campaignId))
      .to.emit(this.Donation, "FundsWithdrawn")
      .withArgs(campaignId, amount2);
    const ownerAfterBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    const diff = ownerAfterBalance - ownerBeforeBalance;
    expect(diff).to.equal(10);
  });
};
