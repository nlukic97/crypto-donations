//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

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

    event NewCampaign(string _title, string _description, uint256 _timeGoal, uint256 _moneyGoal);
    event NewDonation(uint256 _campaignId, uint256 _amount);
    event FundsWithdrawn(uint256 id, uint256 amount);

    error NoEmptyStrings();
    error InvalidTimeGoal();
    error InsufficientAmount();
    error CampaignIsInactive();
    error NonExistantCampaign();
    error ActiveCampaign();

    modifier noEmptyStrings(string calldata _string) {
        if (keccak256(abi.encodePacked(_string)) == keccak256(abi.encodePacked(""))) revert NoEmptyStrings();
        _;
    }

    modifier checkTime(uint256 _timeGoal) {
        if (_timeGoal > block.timestamp == false) revert InvalidTimeGoal();
        _;
    }

    modifier validateFunds(uint256 amount) {
        if (amount < 1) revert InsufficientAmount();
        _;
    }

    modifier registered(uint256 id) {
        if (campaigns[id].registered == false) revert NonExistantCampaign();
        _;
    }

    modifier withFunds() {
        if (msg.value <= 0) revert InsufficientAmount();
        _;
    }

    modifier notComplete(uint256 id) {
        if (campaigns[id].complete == true) {
            revert CampaignIsInactive();
        } else if (campaigns[id].timeGoal <= block.timestamp) {
            campaigns[id].complete = true;
            revert CampaignIsInactive();
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
        if (campaigns[id].complete == false) revert ActiveCampaign();
        _;
    }

    /// @notice Creates a new donation campaign
    /// @dev It will set all values for the Campaign struct, and increment the counter for the next campaign
    /// @param _title Title of the campaign
    /// @param _description Description of the campaign
    /// @param _timeGoal The timestamp for the campaign deadline
    /// @param _moneyGoal The amount of money the campaign is trying to raise
    function newCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _timeGoal,
        uint256 _moneyGoal
    )
        public
        onlyOwner
        checkTime(_timeGoal)
        noEmptyStrings(_title)
        noEmptyStrings(_description)
        validateFunds(_moneyGoal)
    {
        campaigns[campaignId.current()] = Campaign(_title, _description, _timeGoal, _moneyGoal, true, false);
        campaignId.increment();
        emit NewCampaign(_title, _description, _timeGoal, _moneyGoal);
    }

    /// @notice Donate money to a campaign
    /// @dev The campaign must exist, and the donator must send at least 1 wei
    /// @param id The id of the campaign to donate eth to
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
    /// @param id The id of the campaign we want to withdraw from
    function withdraw(uint256 id) public onlyOwner registered(id) timeOrGoalAchieved(id) complete(id) {
        uint256 balance = campaignBalances[id];

        campaignBalances[id] = 0;

        (bool sent, ) = owner().call{ value: balance }("");
        if (sent == false) revert("Unable to withdraw funds");
        emit FundsWithdrawn(id, balance);
    }
}
