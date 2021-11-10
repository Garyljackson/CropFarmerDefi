// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./CropToken.sol";

contract CropFarm is Context {
    mapping(address => uint256) public stakingBalance;
    mapping(address => bool) public isStaking;
    mapping(address => uint256) public startTime;
    mapping(address => uint256) public cropBalance;

    string public name = "CropFarm";

    IERC20 public daiToken;
    CropToken public cropToken;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);

    constructor(IERC20 _daiToken, CropToken _cropToken) {
        daiToken = _daiToken;
        cropToken = _cropToken;
    }

    function stake(uint256 amount) public {
        require(amount > 0, "You cannot stake zero dai");
        require(
            daiToken.balanceOf(_msgSender()) >= amount,
            "You do not have enough DAI"
        );

        updateCurrentStakeYield(_msgSender());

        daiToken.transferFrom(_msgSender(), address(this), amount);

        stakingBalance[_msgSender()] += amount;
        isStaking[_msgSender()] = true;
        emit Stake(_msgSender(), amount);
    }

    function unstake(uint256 amount) public {
        require(
            isStaking[_msgSender()] && stakingBalance[_msgSender()] >= amount,
            "Nothing to unstake"
        );

        updateCurrentStakeYield(_msgSender());

        stakingBalance[_msgSender()] -= amount;
        if (stakingBalance[_msgSender()] == 0) {
            isStaking[_msgSender()] = false;
        }

        daiToken.transfer(_msgSender(), amount);
        emit Unstake(_msgSender(), amount);
    }

    function withdrawYield() public {
        updateCurrentStakeYield(_msgSender());
        uint256 toTransfer = cropBalance[_msgSender()];

        require(toTransfer > 0, "Nothing to withdraw");

        cropToken.mint(_msgSender(), toTransfer);
        emit YieldWithdraw(_msgSender(), toTransfer);
    }

    function updateCurrentStakeYield(address farmer) private {
        if (isStaking[farmer]) {
            uint256 yield = calculateYield(_msgSender());
            cropBalance[_msgSender()] += yield;
        }
        startTime[_msgSender()] = block.timestamp;
    }

    function calculateYield(address farmer) private view returns (uint256) {
        uint256 yieldTimeSeconds = calculateTimeSpan(farmer);
        uint256 yieldRatePerSecond = calculateYieldRatePerSecond();
        uint256 yieldTotal = yieldTimeSeconds * yieldRatePerSecond;
        return yieldTotal;
    }

    function calculateTimeSpan(address farmer) private view returns (uint256) {
        uint256 endTime = block.timestamp;
        uint256 totalTime = endTime - startTime[farmer];
        return totalTime;
    }

    function calculateYieldRatePerSecond() private pure returns (uint256) {
        uint256 dailyTokenReward = 20;
        uint256 dailyTokenRewardWithDecimals = dailyTokenReward * 10**18;
        uint256 secondsPerDay = 24 * 60 * 60;
        uint256 tokensPerSecond = dailyTokenRewardWithDecimals / secondsPerDay;
        return tokensPerSecond;
    }
}
