import { ethers } from "hardhat";
import { ContractFactory, Wallet } from "ethers";
import { Donation } from "../../typechain";
import { Fixture } from "ethereum-waffle";

type UnitDonationFixtureType = {
  Donation: Donation;
};

export const unitDonationFixture: Fixture<UnitDonationFixtureType> = async (signers: Wallet[]) => {
  const deployer: Wallet = signers[0]; // where does this signer come from?
  console.log(`Here is the deployer: ${deployer.address}`); // logs the address

  const DonationFactory: ContractFactory = await ethers.getContractFactory("Donation");

  /* -------------- */
  // const Donation: Donation = (await DonationFactory.connect(deployer).deploy()) as Donation; // Exceeds block gas limit for some reason
  const Donation: Donation = (await DonationFactory.deploy()) as Donation; // this works
  /* -------------- */

  await Donation.deployed();

  return { Donation };
};
