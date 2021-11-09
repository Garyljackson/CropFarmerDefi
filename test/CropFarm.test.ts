import { expect } from "chai";
import { ethers } from "hardhat";

describe("Crop Farm", () => {
  beforeEach(async () => {
    const [owner, account1, account2] = await ethers.getSigners();

    const MockDai = await ethers.getContractFactory("ERC20Mock");
    const CropToken = await ethers.getContractFactory("CropToken");
    const CropFarm = await ethers.getContractFactory("CropFarm");

    const mockdai = await MockDai.deploy(
      "MockDai",
      "mDai",
      owner.address,
      1000
    );
    const cropToken = await CropToken.deploy();
    const cropFarm = await CropFarm.deploy(mockdai.address, cropToken.address);
  });

  it("Does Something", async () => {});
});
