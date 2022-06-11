import { expect } from "chai";
import { ethers } from "hardhat";

export const shouldRevertEmptyStrings = (): void => {
  it("Should revert empty strings", async function () {
    await expect(
      this.Donation.newCampaign("", "Description", this.deadline, ethers.utils.parseEther("100")),
    ).to.be.revertedWith("NoEmptyStrings");

    await expect(
      this.Donation.newCampaign("title", "", this.deadline, ethers.utils.parseEther("100")),
    ).to.be.revertedWith("NoEmptyStrings");

    await expect(this.Donation.newCampaign("", "", this.deadline, ethers.utils.parseEther("100"))).to.be.revertedWith(
      "NoEmptyStrings",
    );
  });
};
