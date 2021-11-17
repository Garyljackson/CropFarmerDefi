import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";
import {
  CropFarm,
  CropFarm__factory,
  CropToken,
  CropToken__factory,
  DaiToken,
  DaiToken__factory
} from "../typechain";

describe("Crop Farm", () => {
  let daiToken: DaiToken;
  let cropToken: CropToken;
  let cropFarm: CropFarm;

  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  beforeEach(async () => {
    [owner, account1, account2] = await ethers.getSigners();

    const DaiToken = new DaiToken__factory(owner);
    const CropToken = new CropToken__factory(owner);
    const CropFarm = new CropFarm__factory(owner);

    daiToken = await DaiToken.deploy();
    cropToken = await CropToken.deploy();
    cropFarm = await CropFarm.deploy(daiToken.address, cropToken.address);

    await Promise.all([
      daiToken.mint(account1.address, daiAmount),
      daiToken.mint(account2.address, daiAmount),
    ]);
  });

  it("Can Deploy", async () => {
    expect(cropFarm).to.be.ok;
    expect(await cropFarm.name()).to.equal("CropFarm");
  });

  describe("Staking", async () => {
    it("Should fail to stake zero dai", async () => {
      let depositAmount = 0;

      expect(cropFarm.connect(account1).stake(depositAmount)).to.be.revertedWith("You cannot stake zero dai");
    });

    it("Should fail if insufficient dai", async () => {
      let depositAmount = daiAmount.add("10");

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);

      expect(cropFarm.connect(account1).stake(depositAmount)).to.be.revertedWith("You do not have enough DAI");
    });

    it("Deposit Single Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);

      expect((await cropFarm.farmerStakeDetails(account1.address)).isStaking).to.eq(false);

      await cropFarm.connect(account1).stake(depositAmount);

      expect((await cropFarm.farmerStakeDetails(account1.address)).isStaking).to.eq(true);
      expect((await cropFarm.farmerStakeDetails(account1.address)).startTime).to.be.gte(0);
      expect((await cropFarm.farmerStakeDetails(account1.address)).stakingBalance).to.eq(depositAmount);
    });

    it("Deposit Multi Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");
      const depositAmountTotal = ethers.utils.parseEther("20");

      await daiToken.connect(account1).approve(cropFarm.address, depositAmountTotal);
      await cropFarm.connect(account1).stake(depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);

      expect((await cropFarm.farmerStakeDetails(account1.address)).stakingBalance).to.eq(depositAmountTotal);
    });
  });

  describe("Unstaking", async () => {
    it("Should revert when not staked", async () => {
      const withdrawAmount = ethers.utils.parseEther("1");
      expect(cropFarm.connect(account1).unstake(withdrawAmount)).to.be.revertedWith("Nothing to unstake");
    });

    it("Should revert when unstaking more than staked amount", async () => {
      const depositAmount = ethers.utils.parseEther("10");
      const withdrawAmount = depositAmount.add("1");

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);

      expect(cropFarm.connect(account1).unstake(withdrawAmount)).to.be.revertedWith(
        "Unstake amount exceeds stake",
      );
    });

    it("Can unstake full amount", async () => {
      const depositAmount = ethers.utils.parseEther("100");

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);
      await cropFarm.connect(account1).unstake(depositAmount);

      expect((await cropFarm.farmerStakeDetails(account1.address)).stakingBalance).to.be.eq(0);
      expect((await cropFarm.farmerStakeDetails(account1.address)).isStaking).to.eq(false);
    });

    it("Can unstake partial amount", async () => {
      const depositAmount = ethers.utils.parseEther("100");
      const withdrawAmount = ethers.utils.parseEther("42.51");
      const amountDiff = depositAmount.sub(withdrawAmount);

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);
      await cropFarm.connect(account1).unstake(withdrawAmount);

      expect((await cropFarm.farmerStakeDetails(account1.address)).stakingBalance).to.be.eq(amountDiff);
      expect((await cropFarm.farmerStakeDetails(account1.address)).isStaking).to.eq(true);
    });

    it("Returns unstaked amount to address", async () => {
      const depositAmount = ethers.utils.parseEther("222.456");
      const withdrawAmount = ethers.utils.parseEther("97.3");
      const amountDiff = depositAmount.sub(withdrawAmount);
      const initialDiaAmount = await daiToken.balanceOf(account1.address);

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);
      await cropFarm.connect(account1).unstake(withdrawAmount);

      expect(await daiToken.balanceOf(account1.address)).to.be.eq(initialDiaAmount.sub(amountDiff));
    });
  });

  describe("Withdraw Yield", async () => {
    let secondsPerDay: number;
    let expectedYieldStart: BigNumber;
    let expectedYieldEnd: BigNumber;

    beforeEach(async () => {
      const depositAmount = ethers.utils.parseEther("100");
      secondsPerDay = 24 * 60 * 60;
      expectedYieldStart = ethers.utils.parseEther("19");
      expectedYieldEnd = ethers.utils.parseEther("21");

      await cropToken.grantRole(await cropToken.MINTER_ROLE(), cropFarm.address);

      await daiToken.connect(account1).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account1).stake(depositAmount);

      await daiToken.connect(account2).approve(cropFarm.address, depositAmount);
      await cropFarm.connect(account2).stake(depositAmount);
    });

    it("Should calculate correct yield ", async () => {
      await time.increase(secondsPerDay);

      expect(await cropFarm.calculateYield(account1.address))
        .to.be.gt(expectedYieldStart)
        .and.to.be.lt(expectedYieldEnd);
    });

    it("Should update yield crop balance", async () => {
      await time.increase(secondsPerDay);
      await cropFarm.updateAllYields();

      expect((await cropFarm.farmerStakeDetails(account1.address)).cropBalance)
        .to.be.gt(expectedYieldStart)
        .and.to.be.lt(expectedYieldEnd);

      expect((await cropFarm.farmerStakeDetails(account2.address)).cropBalance)
        .to.be.gt(expectedYieldStart)
        .and.to.be.lt(expectedYieldEnd);
    });

    it("Should withdraw crop token yield to account", async () => {
      await time.increase(secondsPerDay);
      await cropFarm.updateAllYields();
      await cropFarm.connect(account1).withdrawYield();

      expect(await cropToken.balanceOf(account1.address))
        .to.be.gt(expectedYieldStart)
        .and.to.be.lt(expectedYieldEnd);
    });

    it("Should fail if no yield available", async () => {
      expect(cropFarm.connect(account1.address).withdrawYield()).to.be.revertedWith("Nothing to withdraw");
    });
  });
});
