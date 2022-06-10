import { expect } from "chai";

export const shouldRevertWithdraw = (): void => {
  it("should revert wthdrawls from non-existant campaigns", async function () {
    await expect(this.Donation.withdraw(5678)).to.be.revertedWith("NonExistantCampaign");
  });

  it("should revert withdrawl from incomplete campaign", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).connect(this.alice).donate(0, { value: 1 });
    await expect(this.Donation.withdraw(0)).to.be.revertedWith("ActiveCampaign");
  });

  it("should revert withdrawl from wallets that are not the owners", async function () {
    await this.Donation.newCampaign(...this.campaignArgs);
    await this.Donation.connect(this.alice).donate(0, { value: 1 });
    await expect(this.Donation.connect(this.alice).withdraw(1)).to.be.revertedWith("Ownable: caller is not the owner");
  });
};
