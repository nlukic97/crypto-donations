import { MockContract } from "ethereum-waffle";
import { Signer } from "ethers";
import { waffle } from "hardhat";
import NftReward from "../../artifacts/contracts/NftReward.sol/NftReward.json";

export const deployMockNftContract = async function (deployer: Signer) {
  const mockNft: MockContract = await waffle.deployMockContract(deployer, NftReward.abi);

  await mockNft.deployed();

  await mockNft.mock.awardItem.returns(0);

  return mockNft;
};
