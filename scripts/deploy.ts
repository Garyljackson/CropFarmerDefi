import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  CropFarm__factory,
  CropToken__factory,
  ERC20Mock__factory,
} from "../typechain";

async function main() {
  const [owner] = await ethers.getSigners();
  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  const MockDai = new ERC20Mock__factory(owner);
  const CropToken = new CropToken__factory(owner);
  const CropFarm = new CropFarm__factory(owner);

  const mockDaiContract = await MockDai.deploy(
    "MockDai",
    "mDai",
    owner.address,
    daiAmount
  );

  const cropTokenContract = await CropToken.deploy();

  const cropFarmContract = await CropFarm.deploy(
    mockDaiContract.address,
    cropTokenContract.address
  );
  await cropTokenContract.deployed();

  console.log(
    "Crop Token Farm Contract deployed to:",
    cropFarmContract.address
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
