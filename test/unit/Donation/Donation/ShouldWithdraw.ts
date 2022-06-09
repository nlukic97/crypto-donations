import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, formatUnits } from "ethers/lib/utils";

export const shouldWithdraw = (): void => {
  it("should withdraw from campaign where only money goal is reached", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).donate(0, { value: parseEther("100") }); // making campaign with 0 complete due to achieving moneyGoal

    const ownerBeforeBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("100"));

    const ownerAfterBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));
    const diff = ownerAfterBalance - ownerBeforeBalance;
    expect(diff).to.equal(100);
  });

  it("should withdraw from campaign where only timeGoal is reached", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);

    // making to have some funds (not full goal)
    await this.Donation.connect(this.alice).donate(0, { value: parseEther("10") });
    await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");

    // setting SC timestamp to be 20s after the campaign deadline
    await ethers.provider.send("evm_setNextBlockTimestamp", [this.deadline + 20]);
    const ownerBeforeBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    await expect(this.Donation.withdraw(0)).to.emit(this.Donation, "FundsWithdrawn").withArgs(0, parseEther("10"));
    const ownerAfterBalance = parseInt(formatUnits(await this.owner.getBalance(), "ether"));

    const diff = ownerAfterBalance - ownerBeforeBalance;
    expect(diff).to.equal(10);
  });
};
