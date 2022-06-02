import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
// import { MockProvider } from 'ethereum-waffle';

export async function fixture() {
  const Donation: ContractFactory = await ethers.getContractFactory("Donation");
  const donation: Contract = await Donation.deploy();
  await donation.deployed();

  //   const [wallet, otherWallet] = new MockProvider().getWallets();

  return donation;
}
