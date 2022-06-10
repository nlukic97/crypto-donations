import { Fixture } from "ethereum-waffle";
import { ContractFactory, Wallet } from "ethers";
import { ethers } from "hardhat";
import { NftReward } from "../../typechain";

type NftFixtureType = {
  NftFixture: NftReward;
};

export const NftFixture: Fixture<NftFixtureType> = async (signers: Wallet[]) => {
  const deployer: Wallet = signers[0];

  const NftFactory: ContractFactory = await ethers.getContractFactory(`NftReward`);

  const NftFixture: NftReward = (await NftFactory.connect(deployer).deploy()) as NftReward;

  await NftFixture.deployed();

  return { NftFixture };
};
