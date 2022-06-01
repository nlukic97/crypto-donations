import { expect } from "chai";
import { loadFixture, deployContract } from "ethereum-waffle";
import { ethers } from "hardhat";

describe("Donation", function () {
  async function fixture() {
    const Donation = await ethers.getContractFactory("Donation");
    const donation = await Donation.deploy();
    await donation.deployed();

    return donation;
  }

  it("Should create campaign", async function () {
    const aDayInSeconds = 86400; //a day in seconds
    const donation = await loadFixture(fixture);

    await donation.newCampaign(
      "Save the planet",
      "Description for save the planet",
      Math.round(new Date().getTime() / 1000) + aDayInSeconds,
      BigInt(100 * 10 ** 18),
    );

    const campaign1 = await donation.campaigns(0);

    expect(campaign1.name).to.be.equal("Save the planet");
    expect(campaign1.description).to.be.equal("Description for save the planet");
    expect(campaign1.moneyGoal).to.be.equal(BigInt(100 * 10 ** 18));
  });
});
