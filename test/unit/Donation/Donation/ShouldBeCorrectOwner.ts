import { expect } from "chai";

export const shouldBeCorrectOwner = (): void => {
  it("Should assign the contract deployer to be the owner of the address", async function () {
    expect(await this.Donation.owner()).to.be.equal(this.owner.address);
  });
};
