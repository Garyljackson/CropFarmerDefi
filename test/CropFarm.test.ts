import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  CropFarm,
  CropFarm__factory,
  CropToken,
  CropToken__factory,
  ERC20Mock,
  ERC20Mock__factory,
} from "../typechain";

describe("Crop Farm", () => {
  let mockDaiContract: ERC20Mock;
  let cropTokenContract: CropToken;
  let cropFarmContract: CropFarm;

  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  beforeEach(async () => {
    [owner, account1, account2] = await ethers.getSigners();

    const MockDai = new ERC20Mock__factory(owner);
    const CropToken = new CropToken__factory(owner);
    const CropFarm = new CropFarm__factory(owner);

    mockDaiContract = await MockDai.deploy("MockDai", "mDai", owner.address, daiAmount);

    cropTokenContract = await CropToken.deploy();

    cropFarmContract = await CropFarm.deploy(mockDaiContract.address, cropTokenContract.address);

    await Promise.all([
      mockDaiContract.mint(account1.address, daiAmount),
      mockDaiContract.mint(account2.address, daiAmount),
    ]);
  });

  it("Can Deploy", async () => {
    expect(cropFarmContract).to.be.ok;
    expect(await cropFarmContract.name()).to.equal("CropFarm");
  });

  describe("Staking", async () => {
    it("Should fail to stake zero dai", async () => {
      let depositAmount = 0;

      expect(cropFarmContract.connect(account1).stake(depositAmount)).to.be.revertedWith("You cannot stake zero dai");
    });

    it("Should fail if insufficient dai", async () => {
      let depositAmount = daiAmount.add("10");

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);

      expect(cropFarmContract.connect(account1).stake(depositAmount)).to.be.revertedWith("You do not have enough DAI");
    });

    it("Deposit Single Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");
      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);

      expect(await cropFarmContract.isStaking(account1.address)).to.eq(false);

      expect(await cropFarmContract.connect(account1).stake(depositAmount)).to.be.ok;

      expect(await cropFarmContract.isStaking(account1.address)).to.eq(true);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.eq(depositAmount);
    });

    it("Deposit Multi Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");
      const depositAmountTotal = ethers.utils.parseEther("20");

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmountTotal);

      await cropFarmContract.connect(account1).stake(depositAmount);
      await cropFarmContract.connect(account1).stake(depositAmount);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.eq(depositAmountTotal);
    });
  });

  describe("Unstaking", async () => {
    it("Should revert when not staked", async () => {
      const withdrawAmount = ethers.utils.parseEther("1");
      expect(cropFarmContract.connect(account1).unstake(withdrawAmount)).to.be.revertedWith("Nothing to unstake");
    });

    it("Should revert when unstaking more than staked amount", async () => {
      const depositAmount = ethers.utils.parseEther("10");
      const withdrawAmount = depositAmount.add("1");

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);

      await cropFarmContract.connect(account1).stake(depositAmount);

      expect(cropFarmContract.connect(account1).unstake(withdrawAmount)).to.be.revertedWith(
        "Unstake amount exceeds stake",
      );
    });

    it("Can unstake full amount", async () => {
      const depositAmount = ethers.utils.parseEther("100");

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);

      await cropFarmContract.connect(account1).stake(depositAmount);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.be.eq(depositAmount);
    });

    it("Can unstake partial amount", async () => {
      const depositAmount = ethers.utils.parseEther("100");
      const withdrawAmount = ethers.utils.parseEther("42.51");
      const amountDiff = depositAmount.sub(withdrawAmount);

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);
      await cropFarmContract.connect(account1).stake(depositAmount);
      await cropFarmContract.connect(account1).unstake(withdrawAmount);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.be.eq(amountDiff);
    });

    it("Returns unstaked amount to address", async () => {
      const depositAmount = ethers.utils.parseEther("222.456");
      const withdrawAmount = ethers.utils.parseEther("97.3");
      const amountDiff = depositAmount.sub(withdrawAmount);
      const initialDiaAmount = await mockDaiContract.balanceOf(account1.address);

      await mockDaiContract.connect(account1).approve(cropFarmContract.address, depositAmount);
      await cropFarmContract.connect(account1).stake(depositAmount);
      await cropFarmContract.connect(account1).unstake(withdrawAmount);

      expect(await mockDaiContract.balanceOf(account1.address)).to.be.eq(initialDiaAmount.sub(amountDiff));
    });
  });
});
