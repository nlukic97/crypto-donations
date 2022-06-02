import { expect } from "chai";
import { loadFixture } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { unitDonationFixture } from "../shared/unitDonationFixture";

describe("Unit tests", async () => {
  it("Should create campaign", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here

    const aDayInSeconds: number = 86400; //a day in seconds
    const deadline: number = Math.round(new Date().getTime() / 1000) + aDayInSeconds;

    const tx: ContractTransaction = await Donation.newCampaign(
      "Save the planet",
      "Description for save the planet",
      deadline,
      BigInt(100 * 10 ** 18),
    );

    const campaign1 = await Donation.campaigns(0);

    expect(campaign1.name).to.be.equal("Save the planet");
    expect(campaign1.description).to.be.equal("Description for save the planet");
    expect(campaign1.timeGoal).to.be.equal(deadline);
    expect(campaign1.moneyGoal).to.be.equal(BigInt(100 * 10 ** 18));

    expect(tx)
      .to.emit(Donation, "NewCampaign")
      .withArgs("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));
  });
});
