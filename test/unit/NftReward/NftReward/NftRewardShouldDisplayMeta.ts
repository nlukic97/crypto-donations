import { expect } from "chai";

export const shouldDisplayMetaData = (): void => {
  it("should display token metadata", async function () {
    expect(await this.Nft.name()).to.equal("Thanks4Donating");
    expect(await this.Nft.symbol()).to.equal("TNX4D");
  });
};
