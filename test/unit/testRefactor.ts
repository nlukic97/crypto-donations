/* import { expect } from "chai";
import { ethers } from "hardhat";

describe("Donation contract", function () {
  let DonationFactory;
  let Donation;
  let owner;
  let alice;
  let bob;
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    [owner, alice, bob] = await ethers.getSigners();

    DonationFactory = await ethers.getContractFactory("Donation");

    Donation = await DonationFactory.connect(owner).deploy();
    expect(await Donation.owner()).to.be.equal(owner.address);
  });
});
 */
