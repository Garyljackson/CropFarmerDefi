import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CropFarm, CropToken, ERC20Mock } from "../typechain";

describe("Crop Farm", () => {
  let mockDaiContract: ERC20Mock;
  let cropTokenContract: CropToken;
  let cropFarmContract: CropFarm;

  let ownerAccount: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  beforeEach(async () => {
    [ownerAccount, account1, account2] = await ethers.getSigners();

    const MockDai = await ethers.getContractFactory("ERC20Mock");
    const CropToken = await ethers.getContractFactory("CropToken");
    const CropFarm = await ethers.getContractFactory("CropFarm");

    mockDaiContract = await MockDai.deploy(
      "MockDai",
      "mDai",
      ownerAccount.address,
      daiAmount
    );

    cropTokenContract = await CropToken.deploy();

    cropFarmContract = await CropFarm.deploy(
      mockDaiContract.address,
      cropTokenContract.address
    );

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

      expect(
        cropFarmContract.connect(account1).stake(depositAmount)
      ).to.be.revertedWith("You cannot stake zero dai");
    });

    it("Should fail if insufficient dai", async () => {
      let depositAmount = daiAmount.add("10");

      await mockDaiContract
        .connect(account1)
        .approve(cropFarmContract.address, depositAmount);

      expect(
        cropFarmContract.connect(account1).stake(depositAmount)
      ).to.be.revertedWith("You do not have enough DAI");
    });

    it("Deposit Single Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");
      await mockDaiContract
        .connect(account1)
        .approve(cropFarmContract.address, depositAmount);

      expect(await cropFarmContract.isStaking(account1.address)).to.eq(false);

      expect(await cropFarmContract.connect(account1).stake(depositAmount)).to
        .be.ok;

      expect(await cropFarmContract.isStaking(account1.address)).to.eq(true);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.eq(
        depositAmount
      );
    });

    it("Deposit Multi Stake", async () => {
      let depositAmount = ethers.utils.parseEther("10");
      const depositAmountTotal = ethers.utils.parseEther("20");

      await mockDaiContract
        .connect(account1)
        .approve(cropFarmContract.address, depositAmountTotal);

      await cropFarmContract.connect(account1).stake(depositAmount);
      await cropFarmContract.connect(account1).stake(depositAmount);

      expect(await cropFarmContract.stakingBalance(account1.address)).to.eq(
        depositAmountTotal
      );
    });
  });
});
