import { expect } from "chai";
import { ethers } from "ethers";
import { getPrevBlockTimestamp } from "../../../shared/utils";

export const shouldCreateCampaign = (): void => {
  const campaignId = 0;

  const _submitTitle = "title";
  const _submitDescription = "description";
  const _days = 2;
  const _submitMoneyGoal = ethers.utils.parseEther("100");

  it("Should create campaign", async function () {
    expect((await this.Donation.campaigns(campaignId)).registered).to.equal(false);

    // creating campaign (which will have id of 0)
    const tx = await this.Donation.newCampaign(_submitTitle, _submitDescription, _days, _submitMoneyGoal);

    // calculating the unix timestamp that should be submitted
    const prevBlockTimestamp = await getPrevBlockTimestamp();
    const expectedTimeGoal = prevBlockTimestamp + _days * this.dayInSeconds;

    await expect(tx)
      .to.emit(this.Donation, "NewCampaign")
      .withArgs(_submitTitle, _submitDescription, expectedTimeGoal, _submitMoneyGoal);

    const { name, description, timeGoal, moneyGoal, registered, complete } = await this.Donation.campaigns(0);

    expect(name).to.be.equal(_submitTitle);
    expect(description).to.be.equal(_submitDescription);
    expect(timeGoal).to.be.equal(expectedTimeGoal).and.to.be.above(prevBlockTimestamp);
    expect(moneyGoal).to.be.equal(_submitMoneyGoal);
    expect(registered).to.equal(true);
    expect(complete).to.equal(false);
  });
};
