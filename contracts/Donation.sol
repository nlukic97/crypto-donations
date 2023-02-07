//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface INftReward {
    function awardItem(address receiver) external;

    function balanceOf(address owner) external returns (uint256);
}

/// @title Contract for making donation campaigns that accept eth
/// and reward donators one time with an newly minted NFT
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
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => uint256) public campaignBalances;
    mapping(uint256 => bool) public campaingLockedByCreator;
    mapping(uint256 => bool) public campaingLockedByOwner;
    mapping(uint256 => bool) public campaignComplete;

    // todo test
    INftReward public immutable nftReward;
    bool private _campaignZeroCreated;

    // todo test
    constructor(address _nftReward) {
        nftReward = INftReward(_nftReward);
    }

    event CampaignLocked(uint256 id);
    event CampaignUnlocked(uint256 id);
    event FundsWithdrawn(uint256 id, uint256 amount);
    event NewDonation(uint256 campaignId, uint256 amount);
    event NewCampaign(string title, string description, uint256 timeGoal, uint256 moneyGoal);

    error Unauthorized();
    error ActiveCampaign();
    error NoEmptyStrings();
    error InvalidTimeGoal();
    error CampaignIsLocked();
    error InsufficientAmount();
    error CampaignIsInactive();
    error NonExistantCampaign();
    error campaignAlreadyUnlocked();

    modifier noEmptyStrings(string calldata _string) {
        if (bytes(_string).length <= 0) revert NoEmptyStrings();
        _;
    }

    /// @dev _campaignZeroCreated will remain false until the first campaign is created.
    /// If it is false, no campaigns have been created.
    /// If it is true, we compare the id arg to the counter campaignId.
    /// When we create the first campaign, its id will be 0, and the campaignId counter
    /// will incremented to 1 (which will be the id for the next campaign to be created).
    /// If the id arg passed to this modifier is (following the steps above) is the same
    /// as campaignId counter (1) or higher,the modifier will revert as
    /// there is no campaign created with this id.
    modifier registered(uint256 id) {
        if (_campaignZeroCreated == false || id >= campaignId.current()) revert NonExistantCampaign();
        _;
    }

    modifier onlyCreator(uint256 id) {
        if (campaigns[id].creator != msg.sender) revert Unauthorized();
        _;
    }

    modifier lock(uint256 id) {
        if (campaingLockedByOwner[id] || campaingLockedByCreator[id]) revert CampaignIsLocked();
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
    ) external noEmptyStrings(_title) noEmptyStrings(_description) {
        if (_deadlineInDays <= 0) revert InvalidTimeGoal();
        if (_moneyGoal < 1) revert InsufficientAmount();

        campaigns[campaignId.current()] = Campaign(
            _title,
            _description,
            block.timestamp + _deadlineInDays * 1 days,
            _moneyGoal,
            msg.sender
        );

        if (campaignId.current() == 0) _campaignZeroCreated = true;

        campaignId.increment();

        emit NewCampaign(_title, _description, _deadlineInDays, _moneyGoal);
    }

    /// @notice Donate money to a campaign
    /// @dev The campaign must exist, and the donator must send at least 1 wei
    /// @param id The id of the campaign to donate eth to
    function donate(uint256 id) external payable lock(id) registered(id) {
        Campaign storage campaign = campaigns[id];

        if (msg.value <= 0) revert InsufficientAmount();
        if (campaignComplete[id] == true || campaign.timeGoal <= block.timestamp) revert CampaignIsInactive();

        campaignBalances[id] += msg.value;

        if (campaignBalances[id] >= campaign.moneyGoal) {
            campaignComplete[id] = true;
        }

        // check to only mint nft once
        if (nftReward.balanceOf(msg.sender) > 0 == false) {
            nftReward.awardItem(msg.sender);
        }
        emit NewDonation(id, msg.value);
    }

    /// @notice Withdraw money from a campaign that is complete
    /// @dev The campaign must have the moneyGoal or timeGoal met in order to withdraw.
    /// @param id The id of the campaign we want to withdraw from
    function withdraw(uint256 id) external registered(id) lock(id) onlyCreator(id) {
        Campaign storage campaign = campaigns[id];

        /* 
        no need to check for moneyGoal, since the campaign will be marked
        as complete: true if a previous call to the method donate() caused the moneyGoal to be reached. */
        if (campaignComplete[id] == false) {
            if (campaign.timeGoal <= block.timestamp) {
                campaignComplete[id] = true;
            } else {
                revert ActiveCampaign();
            }
        }

        uint256 balance = campaignBalances[id];
        campaignBalances[id] = 0;

        (bool sent, ) = owner().call{ value: balance }("");
        if (sent == false) revert("Unable to withdraw funds");

        emit FundsWithdrawn(id, balance);
    }

    /// @notice Allows the contract owner to lock an unlocked campaign, preventing donations and withdrawals to it.
    /// @param id The id of the campaign to lock
    function lockCampaign(uint256 id) external onlyOwner registered(id) lock(id) {
        campaingLockedByOwner[id] = true;
        emit CampaignLocked(id);
    }

    /// @notice Allows the owner to unlock a previously locked a campaign, allowing donations and withdrawals to it.
    /// @param id The id of the campaign to unlock
    function unlockCampaign(uint256 id) external onlyOwner registered(id) {
        if (campaingLockedByOwner[id] == false) revert campaignAlreadyUnlocked();

        campaingLockedByOwner[id] = false;
        emit CampaignUnlocked(id);
    }
}
