import { waffle } from "hardhat";

export const getPrevBlockTimestamp = async function () {
  const blockNumBefore = await waffle.provider.getBlockNumber();
  const blockBefore = await waffle.provider.getBlock(blockNumBefore);

  return blockBefore.timestamp;
};
