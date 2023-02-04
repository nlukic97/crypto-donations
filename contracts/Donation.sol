//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Contract for making donation campaigns that accept eth
/// @author Nikola Lukic
/// @notice Made as a task of the Solidity Bootcamp
contract Donation is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private campaignId;

    struct Campaign {
        string name;
        string description;
        uint256 timeGoal;
        uint256 moneyGoal;
        address creator;
        bool registered;
        bool complete;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => uint256) public campaignBalances;
    mapping(uint256 => bool) public campaingLocked;

    event FundsWithdrawn(uint256 id, uint256 amount);
    event NewDonation(uint256 _campaignId, uint256 _amount);
    event NewCampaign(string _title, string _description, uint256 _timeGoal, uint256 _moneyGoal);

    error unauthorized();
    error ActiveCampaign();
    error NoEmptyStrings();
    error InvalidTimeGoal();
    error campaignLocked();
    error InsufficientAmount();
    error CampaignIsInactive();
    error NonExistantCampaign();

    modifier noEmptyStrings(string calldata _string) {
        if (bytes(_string).length <= 0) revert NoEmptyStrings();
        _;
    }

    modifier registered(uint256 id) {
        if (campaigns[id].registered == false) revert NonExistantCampaign();
        _;
    }

    modifier campaignNotLocked(uint256 id) {
        if (campaingLocked[id]) revert campaignLocked();
        _;
    }

    /// @notice Creates a new donation campaign
    /// @dev It will set all values for the Campaign struct within the campaigns mapping, and increment the counter for the next campaign
    /// @param _title Title of the campaign
    /// @param _description Description of the campaign
    /// @param _deadlineInDays The number of days for the campaign deadline
    /// @param _moneyGoal The amount of money the campaign is trying to raise
    function newCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _deadlineInDays,
        uint256 _moneyGoal
    ) external onlyOwner noEmptyStrings(_title) noEmptyStrings(_description) {
        if (_deadlineInDays <= 0) revert InvalidTimeGoal();
        if (_moneyGoal < 1) revert InsufficientAmount();

        campaigns[campaignId.current()] = Campaign(
            _title,
            _description,
            block.timestamp + _deadlineInDays * 1 days,
            _moneyGoal,
            msg.sender,
            true,
            false
        );

        campaignId.increment();

        emit NewCampaign(_title, _description, _deadlineInDays, _moneyGoal);
    }

    /// @notice Donate money to a campaign
    /// @dev The campaign must exist, and the donator must send at least 1 wei
    /// @param id The id of the campaign to donate eth to
    function donate(uint256 id) external payable campaignNotLocked(id) registered(id) {
        Campaign storage campaign = campaigns[id];

        if (msg.value <= 0) revert InsufficientAmount();
        if (campaign.complete == true || campaign.timeGoal <= block.timestamp) revert CampaignIsInactive();

        campaignBalances[id] += msg.value;

        if (campaignBalances[id] >= campaign.moneyGoal) {
            campaign.complete = true;
        }

        emit NewDonation(id, msg.value);
    }

    /// @notice Withdraw money from a campaign that is complete
    /// @dev The campaign must have the moneyGoal or timeGoal met in order to withdraw.
    /// @param id The id of the campaign we want to withdraw from
    function withdraw(uint256 id) external campaignNotLocked(id) registered(id) {
        // todo owner is the person who created the campaign, no? Maybe update this modifier
        Campaign storage campaign = campaigns[id];
        if (msg.sender != campaigns[id].creator) revert unauthorized();

        /* no need to check for moneyGoal, since the campaign will be marked
        as complete: true if a calling donate() caused the moneyGoal to be reached. */
        if (campaign.timeGoal <= block.timestamp) {
            campaign.complete = true;
        }
        if (campaign.complete == false) revert ActiveCampaign();

        uint256 balance = campaignBalances[id];
        campaignBalances[id] = 0;

        (bool sent, ) = owner().call{ value: balance }("");
        if (sent == false) revert("Unable to withdraw funds");

        emit FundsWithdrawn(id, balance);
    }

    function lockCampaign(uint256 id) external onlyOwner {
        campaingLocked[id] = true;
    }

    function unlockCampaign(uint256 id) external onlyOwner {
        campaingLocked[id] = false;
    }
}
