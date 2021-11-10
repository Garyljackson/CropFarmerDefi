import { expect } from "chai";
import { ethers } from "hardhat";

describe("CropToken", () => {
  it("Can Deploy", async () => {
    const CropToken = await ethers.getContractFactory("CropToken");
    const cropToken = await CropToken.deploy();

    await cropToken.deployed();

    expect(cropToken).to.be.ok;
    expect(await cropToken.name()).to.eq("Crop Token");
    expect(await cropToken.symbol()).to.eq("CROP");
  });
});
