//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Contract for making donation campaigns that accept ether
/// @author Nikola Lukic
/// @notice Made as task 1 of the Solidity Bootcamp
/// @dev All function calls are currently implemented without side effects
contract Donation is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private campaignId;

    struct Campaign {
        string name;
        string description;
        uint256 timeGoal;
        uint256 moneyGoal;
        bool registered;
        bool complete;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => uint256) public campaignBalances;

    event NewCampaign(string _name, string _description, uint256 _timeGoal, uint256 _moneyGoal);
    event NewDonation(uint256 _campaignId, uint256 _amount);
    event FundsWithdrawn(uint256 id, uint256 amount);

    modifier noEmptyStrings(string calldata _string) {
        if (isEmptyString(_string)) revert("No empty strings");
        _;
    }

    modifier checkTime(uint256 _timeGoal) {
        // must be 24 hours at the very least. But block.timestamp is not accurate
        if (_timeGoal > block.timestamp == false) revert("Invalid time goal");
        _;
    }

    modifier validateFunds(uint256 amount) {
        if (amount < 1) revert("Insufficient amount");
        _;
    }

    modifier registered(uint256 id) {
        if (campaigns[id].registered == false) revert("Non-existant campaign");
        _;
    }

    modifier withFunds() {
        if (msg.value <= 0) revert("Insuficcient amount");
        _;
    }

    modifier notComplete(uint256 id) {
        if (campaigns[id].complete == true) {
            revert("Campaign is complete");
        } else if (campaigns[id].timeGoal <= block.timestamp) {
            campaigns[id].complete = true;
            revert("Campaign is complete");
        }
        _;
    }

    modifier timeOrGoalAchieved(uint256 id) {
        if (campaignBalances[id] >= campaigns[id].moneyGoal || campaigns[id].timeGoal <= block.timestamp) {
            campaigns[id].complete = true;
        }
        _;
    }

    modifier complete(uint256 id) {
        if (campaigns[id].complete == false) {
            revert("Campaign is still active");
        }
        _;
    }

    /// @notice Checks if a string is an empty string
    /// @dev Returns true if we pass in an empty string as an argument, otherwise returns false
    /// @param _string The string we want to check is not empty
    /// @return isEmpty as a boolean
    function isEmptyString(string calldata _string) internal pure returns (bool isEmpty) {
        return keccak256(abi.encodePacked(_string)) == keccak256(abi.encodePacked(""));
    }

    /// @notice Creates a new donation campaign
    /// @dev It will set all values for the Campaign struct, and increment the counter for the next campaign
    /// @param _name The string we want to check is not empty
    /// @param _description The string we want to check is not empty
    /// @param _timeGoal The string we want to check is not empty
    /// @param _moneyGoal The string we want to check is not empty
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
        campaigns[campaignId.current()] = Campaign(_name, _description, _timeGoal, _moneyGoal, true, false);
        campaignId.increment();
        emit NewCampaign(_name, _description, _timeGoal, _moneyGoal);
    }

    /// @notice Donate money to a campaign
    /// @dev The campaign must exist, and the donator must send at least 1 wei
    /// @param id The id of the campaign we want to donate eth to
    function donate(uint256 id) public payable registered(id) notComplete(id) withFunds {
        Campaign storage campaign = campaigns[id];
        campaignBalances[id] += msg.value;

        if (campaignBalances[id] >= campaign.moneyGoal || campaign.timeGoal <= block.timestamp) {
            campaign.complete = true;
        }
        emit NewDonation(id, msg.value);
    }

    /// @notice Withdraw money from a campaign that is complete
    /// @dev The campaign must have the moneyGoal or timeGoal met in order to withdraw.
    /// @param id The id of the campaign we want to donate eth to
    function withdraw(uint256 id) public onlyOwner registered(id) timeOrGoalAchieved(id) complete(id) {
        uint256 balance = campaignBalances[id];

        campaignBalances[id] = 0;

        (bool sent, ) = owner().call{ value: balance }("");
        if (sent == false) revert("Unable to withdraw funds");
        emit FundsWithdrawn(id, balance);
    }
}
