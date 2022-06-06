import { expect } from "chai";
import { loadFixture } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { unitDonationFixture } from "../shared/unitDonationFixture";
import { ethers } from "hardhat";

describe("Unit tests", async () => {
  const dayInSeconds: number = 86400; //a day in seconds
  const currentTimestamp: number = Math.round(new Date().getTime() / 1000);

  const deadline: number = currentTimestamp + 2 * dayInSeconds; //campaign lasts 2 days from now

  // ---------------
  it("Should create campaign", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]); // setting SC timestamp to accurate one

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
    expect(campaign1.timeGoal).to.be.equal(deadline).and.to.be.above(currentTimestamp);
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

  // ---------------
  it("should accept donation", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));
    const tx: ContractTransaction = await Donation.donate(0, { value: 1 });

    expect(tx).to.emit(Donation, "NewDonation").withArgs(0, 1);
    expect(await Donation.campaignBalances(0)).to.equal(1);
  });

  // ---------------
  it("should revert donation with no funds", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, BigInt(100 * 10 ** 18));

    await expect(Donation.donate(0)).to.be.revertedWith("Insuficcient amount");
    await expect(Donation.donate(0, { value: 0 })).to.be.revertedWith("Insuficcient amount");
  });

  // ---------------
  it("Should revert if timeGoal than is in the past", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await expect(
      Donation.newCampaign(
        "Save the planet",
        "Description for save the planet",
        currentTimestamp - 1, // timestamp in the past
        1,
      ),
    ).to.be.revertedWith("Invalid time goal");
  });

  // ---------------
  it("should revert withdraw from incomplete campaign", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2);

    await Donation.donate(3, { value: 1 });
    await expect(Donation.withdraw(3)).to.be.revertedWith("Campaign is still active");
  });

  // ---------------
  it("should withdraw from campaign where only money goal is reached", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.donate(3, { value: 1 }); // making campaign with 3 complete due to achieving moneyGoal
    await expect(Donation.withdraw(3)).to.emit(Donation, "FundsWithdrawn").withArgs(3, 2);
  });

  // ---------------
  it("should withdraw from campaign where only timeGoal is reached", async function () {
    const { Donation } = await loadFixture(unitDonationFixture); // loading the fixture here
    await Donation.newCampaign("Save the planet", "Description for save the planet", deadline, 2000);

    await Donation.donate(4, { value: 1 }); // making to have some funds
    await expect(Donation.withdraw(4)).to.be.revertedWith("Campaign is still active");

    await ethers.provider.send("evm_setNextBlockTimestamp", [deadline + 20]); // setting SC timestamp to be 20s after the campaign deadline
    await expect(Donation.withdraw(4)).to.emit(Donation, "FundsWithdrawn").withArgs(4, 1);
  });
});
