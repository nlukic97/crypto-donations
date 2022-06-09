import { expect } from "chai";
import { parseEther, formatEther } from "ethers/lib/utils";

export const shouldReturnExcessEth = (): void => {
  it("should return excess Eth to user who sent more than necessary to complete campaign", async function () {
    await this.Donation.newCampaign(...this.campaignArgs); // goal is 100 eth
    const initialBalance = this.alice.getBalance();
    await this.Donation.connect(this.alice).donate(0, { value: parseEther("1000") }); // payee pays 1000 eth, 100eth should be taken and 900ethshould be returned

    const currentBalance = await this.alice.getBalance();
    const diff = currentBalance.sub(await initialBalance);
    expect(parseInt(formatEther(diff))).to.equal(-100); // ... making a difference in balance of around -100 eth after
  });
};
