import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, formatUnits } from "ethers/lib/utils";
import { BigNumberish } from "ethers";

export const shouldWithdraw = (): void => {
  const campaignId: number = 0;

  const title: string = "title";
  const description: string = "description";
  const days: number = 2;
  const moneyGoal: BigNumberish = parseEther("100");

  it("should withdraw from campaign where only money goal is reached", async function () {
    await this.Donation.newCampaign(title, description, days, moneyGoal);
    await this.Donation.connect(this.alice).donate(campaignId, { value: moneyGoal }); // making campaign with 0 complete due to achieving moneyGoal

    const beforeWithdrawalBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(campaignId))
      .to.emit(this.Donation, "FundsWithdrawn")
      .withArgs(campaignId, moneyGoal);

    const afterWithdrawalBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));
    const diff = afterWithdrawalBalance - beforeWithdrawalBalance;
    expect(diff).to.equal(100);
  });

  it("should withdraw from campaign where only timeGoal is reached", async function () {
    const amountDonated: BigNumberish = parseEther("10");

    // making campaign that has some funds (not full goal reached)
    await this.Donation.newCampaign(title, description, days, moneyGoal);
    await this.Donation.connect(this.alice).donate(campaignId, { value: amountDonated });

    await expect(this.Donation.withdraw(campaignId)).to.be.revertedWith("ActiveCampaign");

    // Setting time to be the timeGoal unix timestamp
    await ethers.provider.send("evm_increaseTime", [2 * this.dayInSeconds]);

    //
    const beforeWithdrawalBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(campaignId))
      .to.emit(this.Donation, "FundsWithdrawn")
      .withArgs(campaignId, amountDonated);
    const afterWithdrawalBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    const diff = afterWithdrawalBalance - beforeWithdrawalBalance;
    expect(diff).to.equal(10);
  });
};
