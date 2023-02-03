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

    modifier registered(uint256 id) {
        if (campaigns[id].registered == false) revert NonExistantCampaign();
        _;
    }

    /// @notice Creates a new donation campaign
    /// @dev It will set all values for the Campaign struct, and increment the counter for the next campaign
    /// @param _title Title of the campaign
    /// @param _description Description of the campaign
    /// @param _deadlineInDays The number of days for the campaign deadline
    /// @param _moneyGoal The amount of money the campaign is trying to raise
    function newCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _deadlineInDays,
        uint256 _moneyGoal
    ) public onlyOwner noEmptyStrings(_title) noEmptyStrings(_description) {
        if (_deadlineInDays <= 0) revert InvalidTimeGoal();
        if (_moneyGoal < 1) revert InsufficientAmount();

        campaigns[campaignId.current()] = Campaign(
            _title,
            _description,
            block.timestamp + _deadlineInDays * 1 days,
            _moneyGoal,
            true,
            false
        );

        campaignId.increment();

        emit NewCampaign(_title, _description, _deadlineInDays, _moneyGoal);
    }

    /// @notice Donate money to a campaign
    /// @dev The campaign must exist, and the donator must send at least 1 wei
    /// @param id The id of the campaign to donate eth to
    function donate(uint256 id) public payable registered(id) {
        Campaign storage campaign = campaigns[id];

        if (msg.value <= 0) revert InsufficientAmount();
        if (campaign.complete == true || campaign.timeGoal <= block.timestamp) revert CampaignIsInactive();

        campaignBalances[id] += msg.value;

        // ending the campaign if the moneygoal or timegoal have been reached
        if (campaignBalances[id] >= campaign.moneyGoal || campaign.timeGoal <= block.timestamp) {
            campaign.complete = true;
        }

        emit NewDonation(id, msg.value);
    }

    /// @notice Withdraw money from a campaign that is complete
    /// @dev The campaign must have the moneyGoal or timeGoal met in order to withdraw.
    /// @param id The id of the campaign we want to withdraw from
    function withdraw(uint256 id) public onlyOwner registered(id) {
        Campaign storage campaign = campaigns[id];

        // ending the campaign if the moneygoal or timegoal have been reached
        if (campaignBalances[id] >= campaign.moneyGoal || campaign.timeGoal <= block.timestamp) {
            campaign.complete = true;
        }

        if (campaign.complete == false) revert ActiveCampaign();

        uint256 balance = campaignBalances[id];
        campaignBalances[id] = 0;

        (bool sent, ) = owner().call{ value: balance }("");
        if (sent == false) revert("Unable to withdraw funds");

        emit FundsWithdrawn(id, balance);
    }
}
