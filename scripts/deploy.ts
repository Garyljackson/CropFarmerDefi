import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { CropFarm__factory, CropToken__factory, DaiToken__factory } from "../typechain";

async function main() {
  const [owner] = await ethers.getSigners();
  const daiAmount: BigNumber = ethers.utils.parseEther("1000");

  const DaiToken = new DaiToken__factory(owner);
  const CropToken = new CropToken__factory(owner);
  const CropFarm = new CropFarm__factory(owner);

  const daiToken = await DaiToken.deploy();

  const cropToken = await CropToken.deploy();

  const cropFarm = await CropFarm.deploy(daiToken.address, cropToken.address);
  await cropToken.deployed();

  console.log(`Mock DAI: ${daiToken.address}`);
  console.log(`Crop Token: ${cropToken.address}`);
  console.log(`Crop Farm: ${cropFarm.address}`);
  console.log(`npx hardhat verify ${daiToken.address} --network ropsten`);
  console.log(`npx hardhat verify --contract contracts/CropToken.sol:CropToken ${cropToken.address} --network ropsten`);
  console.log(`npx hardhat verify ${cropFarm.address} "${daiToken.address}" "${cropToken.address}" --network ropsten`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
