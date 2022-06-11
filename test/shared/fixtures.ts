import { Fixture, MockContract } from "ethereum-waffle";
import { ContractFactory, Wallet } from "ethers";
import { ethers } from "hardhat";
import { Donation, NftReward } from "../../typechain";
import { deployMockNftContract } from "./mocks";

type NftFixtureType = {
  Nft: NftReward;
};

type DonationFixtureType = {
  Donation: Donation;
  mockNft: MockContract;
};

type IntegrationFixtureType = {
  Donation: Donation;
  Nft: NftReward;
};

export const unitNftFixture: Fixture<NftFixtureType> = async (signers: Wallet[]) => {
  const deployer: Wallet = signers[0];
  const NftFactory: ContractFactory = await ethers.getContractFactory(`NftReward`);
  const Nft: NftReward = (await NftFactory.connect(deployer).deploy()) as NftReward;
  await Nft.deployed();

  return { Nft };
};

export const unitDonationFixture: Fixture<DonationFixtureType> = async (signers: Wallet[]) => {
  const deployer: Wallet = signers[0];

  const DonationFactory: ContractFactory = await ethers.getContractFactory(`Donation`);
  const Donation: Donation = (await DonationFactory.connect(deployer).deploy()) as Donation;
  await Donation.deployed();

  const mockNft = await deployMockNftContract(deployer);

  // Required contract variables
  await Donation.connect(deployer).setNftAddress(mockNft.address);

  return { Donation, mockNft };
};

export const IntegrationFixture: Fixture<IntegrationFixtureType> = async (signers: Wallet[]) => {
  const deployer: Wallet = signers[0];

  const DonationFactory: ContractFactory = await ethers.getContractFactory(`Donation`);
  const Donation: Donation = (await DonationFactory.connect(deployer).deploy()) as Donation;
  await Donation.deployed();

  const NftFactory: ContractFactory = await ethers.getContractFactory("NftReward");
  const Nft: NftReward = (await NftFactory.connect(deployer).deploy()) as NftReward;
  await Nft.deployed();

  // Required contract variables
  await Donation.connect(deployer).setNftAddress(Nft.address);
  await Nft.connect(deployer).transferOwnership(Donation.address);

  return { Donation, Nft };
};
