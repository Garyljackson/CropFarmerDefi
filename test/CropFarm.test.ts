import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Crop Farm", () => {
  let mockDaiContract: Contract;
  let cropTokenContract: Contract;
  let cropFarmContract: Contract;

  let ownerSigner: SignerWithAddress;
  let account1Signer: SignerWithAddress;
  let account2Signer: SignerWithAddress;

  beforeEach(async () => {
    [ownerSigner, account1Signer, account2Signer] = await ethers.getSigners();

    const MockDai = await ethers.getContractFactory("ERC20Mock");
    const CropToken = await ethers.getContractFactory("CropToken");
    const CropFarm = await ethers.getContractFactory("CropFarm");

    mockDaiContract = await MockDai.deploy(
      "MockDai",
      "mDai",
      ownerSigner.address,
      1000
    );

    cropTokenContract = await CropToken.deploy();

    cropFarmContract = await CropFarm.deploy(
      mockDaiContract.address,
      cropTokenContract.address
    );
  });

  it("Does Something", async () => {});
});
