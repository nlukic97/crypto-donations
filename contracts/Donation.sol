//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Donation is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private campaignId;

    struct Campaign {
        string name;
        string description;
        uint256 timeGoal;
        uint256 moneyGoal;
        bool registered;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => uint256) public campaignBalances;

    event NewCampaign(string _name, string _description, uint256 _timeGoal, uint256 _moneyGoal);
    event NewDonation(uint256 _campaignId, uint256 _amount);

    modifier noEmptyStrings(string calldata _string) {
        if (isEmptyString(_string)) revert("No empty strings");
        _;
    }

    modifier checkTime(uint256 _timeGoal) {
        // must be 24 hours at the very least. But block.timestamp is not accurate
        if (_timeGoal < block.timestamp + 86400) revert("Invalid time goal.");
        _;
    }

    modifier validateFunds(uint256 amount) {
        if (amount < 1) revert("Insufficient amount");
        _;
    }

    modifier campaignExists(uint256 id) {
        if (campaigns[id].registered == false) revert("Non-existant campaign");
        _;
    }

    modifier withFunds() {
        if (msg.value <= 0) revert("Insuficcient amount");
        _;
    }

    function isEmptyString(string calldata first) internal pure returns (bool) {
        return keccak256(abi.encodePacked(first)) == keccak256(abi.encodePacked(""));
    }

    function newCampaign(
        string calldata _name,
        string calldata _description,
        uint256 _timeGoal,
        uint256 _moneyGoal
    )
        public
        onlyOwner
        checkTime(_timeGoal)
        noEmptyStrings(_name)
        noEmptyStrings(_description)
        validateFunds(_moneyGoal)
    {
        campaigns[campaignId.current()] = Campaign(_name, _description, _timeGoal, _moneyGoal, true);

        campaignId.increment(); // prepare next id for next campaign
        emit NewCampaign(_name, _description, _timeGoal, _moneyGoal);
    }

    // for testing purposes only
    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function donate(uint256 id) public payable campaignExists(id) withFunds {
        campaignBalances[id] += msg.value; // assign msg.value to own variable or is this ok?
        emit NewDonation(id, msg.value);
    }
}
