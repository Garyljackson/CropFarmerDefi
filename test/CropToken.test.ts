import { expect } from "chai";
import { ethers } from "hardhat";
import { CropToken__factory } from "../typechain";

describe("CropToken", () => {
  it("Can Deploy", async () => {
    const [owner] = await ethers.getSigners();
    const CropToken = new CropToken__factory(owner);
    const cropToken = await CropToken.deploy();

    await cropToken.deployed();

    expect(cropToken).to.be.ok;
    expect(await cropToken.name()).to.eq("Crop Token");
    expect(await cropToken.symbol()).to.eq("CROP");
  });
});
