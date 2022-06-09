// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract's to deploy

  // contract 1
  const DonationFactory = await ethers.getContractFactory("Donation");
  const Donation = await DonationFactory.deploy();

  await Donation.deployed();
  console.log("Donation deployed to:", Donation.address);

  // contract 2
  const NftFactory = await ethers.getContractFactory("NftReward");
  const Nft = await NftFactory.deploy();

  await Nft.deployed();
  console.log("NftReward deployed to:", Nft.address);

  // Setting up contract variables
  await Donation.setNftAddress(Nft.address);
  console.log("NftAddress variable on Donation contract updated to: ", Nft.address);

  await Nft.transferOwnership(Donation.address);
  console.log("owner variable on NftReward contract updated to: ", Donation.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
