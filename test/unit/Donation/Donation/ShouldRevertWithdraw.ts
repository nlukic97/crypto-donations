import { expect } from "chai";

export const shouldRevertWithdraw = (): void => {
  const nonExistantCampaignId = 5678;
  const firstCampaignId = 0; //id of the first created campaign
  const campaignArgs = ["title", "description", 2, 2000];

  it("should revert withdraw from non-existant campaigns", async function () {
    await expect(this.Donation.withdraw(nonExistantCampaignId)).to.be.revertedWith("NonExistantCampaign");
  });

  it("should revert withdraw from incomplete campaign", async function () {
    await this.Donation.newCampaign(...campaignArgs);
    await this.Donation.connect(this.alice).connect(this.alice).donate(0, { value: 1 });

    await expect(this.Donation.withdraw(firstCampaignId)).to.be.revertedWith("ActiveCampaign");
  });

  it("should revert withdraw from wallets that are not the owners", async function () {
    await this.Donation.newCampaign(...campaignArgs);
    await this.Donation.connect(this.alice).donate(firstCampaignId, { value: 1 });

    await expect(this.Donation.connect(this.alice).withdraw(firstCampaignId)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
  });
};
