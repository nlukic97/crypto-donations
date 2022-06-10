import { expect } from "chai";
import { ethers } from "hardhat";

export const shouldCreateCampaign = (): void => {
  it("Should create campaign", async function () {
    expect((await this.Donation.campaigns(0)).registered).to.equal(false);

    await expect(this.Donation.newCampaign(...this.campaignArgs))
      .to.emit(this.Donation, "NewCampaign")
      .withArgs(...this.campaignArgs);

    const campaign1 = await this.Donation.campaigns(0);

    expect(campaign1.name).to.be.equal("title");
    expect(campaign1.description).to.be.equal("description");
    expect(campaign1.timeGoal).to.be.equal(this.deadline).and.to.be.above(this.currentTimestamp);
    expect(campaign1.moneyGoal).to.be.equal(ethers.utils.parseEther("100"));
    expect(campaign1.registered).to.equal(true);
    expect(campaign1.complete).to.equal(false);
  });
};
