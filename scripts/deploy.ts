import { BigNumber } from "ethers";
import { ethers } from "hardhat";

async function main() {
  const [ownerAccount] = await ethers.getSigners();
  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  const MockDai = await ethers.getContractFactory("ERC20Mock");
  const CropToken = await ethers.getContractFactory("CropToken");
  const CropFarm = await ethers.getContractFactory("CropFarm");

  const mockDaiContract = await MockDai.deploy(
    "MockDai",
    "mDai",
    ownerAccount.address,
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
