//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// todo test this entire thing
contract NftReward is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bool public ownershipTransfered;

    event NewTokenMinted(uint256 id, address receiver);

    error NoMultipleMinting();
    error AlreadyTransfered();
    error OwnershipNotTrasfered();

    modifier ownershipTransferComplete() {
        if (ownershipTransfered == false) revert OwnershipNotTrasfered(); // todo think of naming convention
        _;
    }

    constructor() ERC721("Thanks4Donating", "TNX4D") {}

    /// todo fix tokenURI param here, make sure to use the right one during tests
    function awardItem(address receiver, string memory tokenURI) external ownershipTransferComplete onlyOwner {
        if (balanceOf(receiver) > 0) revert NoMultipleMinting();

        uint256 newItemId = _tokenIds.current();

        _mint(receiver, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIds.increment();
        emit NewTokenMinted(newItemId, receiver);
    }

    function transferOwnership(address newOwner) public virtual override {
        if (ownershipTransfered == true) revert AlreadyTransfered();

        ownershipTransfered = true;
        super._transferOwnership(newOwner);
    }
}
