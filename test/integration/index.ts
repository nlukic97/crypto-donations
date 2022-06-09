import { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Integration tests", async function () {
  let NftFactory: ContractFactory;
  let Nft: Contract;
  let DonationFactory: ContractFactory;
  let Donation: Contract;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  const urlPlaceholder = "https://example.com/thanks";

  const dayInSeconds: number = 86400;
  const currentTimestamp: number = Math.round(new Date().getTime() / 1000);
  const deadline: number = currentTimestamp + 2 * dayInSeconds;

  const campaignArgs = ["title", "description", deadline, ethers.utils.parseEther("1000")];

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    NftFactory = await ethers.getContractFactory("NftReward");
    Nft = await NftFactory.connect(owner).deploy();

    DonationFactory = await ethers.getContractFactory("Donation");
    Donation = await DonationFactory.connect(owner).deploy();

    await Donation.setNftAddress(Nft.address);
    await Nft.transferOwnership(Donation.address); // so only the Donation SC can mint new NFT's
  });

  describe("NftReward", async function () {
    it("should mint nft upon donating to a campaign for the first time", async function () {
      await Donation.newCampaign(...campaignArgs);
      // console.log(await waffle.provider.getBalance(Donation.address)); // 0 eth

      await Donation.connect(alice).donate(0, { value: 1 });
      // console.log(await waffle.provider.getBalance(Donation.address)); // donated 1 wei, and the contract still has 1 wei

      expect(await Nft.balanceOf(alice.address)).to.equal(1);
    });

    it("should only mint the first time a wallet makes a donation", async function () {
      await Donation.newCampaign(...campaignArgs);
      await Donation.connect(alice).donate(0, { value: 1 });
      expect(await Nft.balanceOf(alice.address)).to.equal(1);

      await Donation.connect(alice).donate(0, { value: 1 });
      expect(await Nft.balanceOf(alice.address)).to.equal(1); // still only owns one nft
      expect(await Nft.ownerOf(0)).to.equal(alice.address);
    });
  });
});
