import { expect } from "chai";
import { loadFixture } from "ethereum-waffle";
import { ContractTransaction, ethers } from "ethers";
import { unitDonationFixture } from "../shared/unitDonationFixture";

describe("Unit tests", async () => {
  const aDayInSeconds: number = 86400; //a day in seconds
  const deadline: number = Math.round(new Date().getTime() / 1000) + aDayInSeconds; //maybe I shoud submit days instead ?

  // ---------------
  it("Should create campaign", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here

    /* const blockTimestamp = await Donation.getTimestamp();
    console.log("block timestamp", blockTimestamp);
    console.log("deadline", deadline); */
    expect((await Donation.campaigns(0)).registered).to.equal(false);

    const tx: ContractTransaction = await Donation.newCampaign(
      "Save the planet",
      "Description for save the planet",
      deadline,
      BigInt(100 * 10 ** 18),
    );

    const campaign1 = await Donation.campaigns(0);

    expect(tx)
      .to.emit(Donation, "NewCampaign")
      .withArgs("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));
    expect(campaign1.name).to.be.equal("Save the planet");
    expect(campaign1.description).to.be.equal("Description for save the planet");
    expect(campaign1.timeGoal).to.be.equal(deadline);
    expect(campaign1.moneyGoal).to.be.equal(BigInt(100 * 10 ** 18));
    expect(campaign1.registered).to.equal(true);
  });

  // ---------------
  it("Should revert empty strings", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here

    await expect(
      Donation.newCampaign("", "Description for save the planet", deadline, BigInt(100 * 10 ** 18)),
    ).to.be.revertedWith("No empty strings");
    await expect(Donation.newCampaign("Some string", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith(
      "No empty strings",
    );
    await expect(Donation.newCampaign("", "", deadline, BigInt(100 * 10 ** 18))).to.be.revertedWith("No empty strings");
  });

  // ---------------
  it("should revert 0 moneyGoal", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here

    await expect(Donation.newCampaign("Test", "Test", deadline, 0)).to.be.revertedWith("Insufficient amount");
  });

  it("should accept donation", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));
    const tx: ContractTransaction = await Donation.donate(0, { value: 1 });

    expect(tx).to.emit(Donation, "NewDonation").withArgs(0, 1);
    expect(await Donation.campaignBalances(0)).to.equal(1);
  });

  it("should revert donation with no funds", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));

    await expect(Donation.donate(0)).to.be.revertedWith("Insuficcient amount");
    await expect(Donation.donate(0, { value: 0 })).to.be.revertedWith("Insuficcient amount");
  });
});
