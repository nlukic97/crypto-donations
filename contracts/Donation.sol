//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Donation is Ownable {
    struct Campaign {
        string name;
        string description;
        uint256 timeGoal;
        uint256 moneyGoal;
    }

    mapping(uint256 => Campaign) public campaigns;

    event NewCampaign(string _name, string _description, uint256 _timeGoal, uint256 _moneyGoal);

    function newCampaign(
        string calldata _name,
        string calldata _description,
        uint256 _timeGoal,
        uint256 _moneyGoal
    ) public onlyOwner {
        campaigns[0] = Campaign(_name, _description, _timeGoal, _moneyGoal);
        emit NewCampaign(_name, _description, _timeGoal, _moneyGoal);
    }
}
