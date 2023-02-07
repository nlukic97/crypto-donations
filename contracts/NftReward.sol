//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NftReward is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bool public ownershipTransfered;

    event NewTokenMinted(uint256 id, address receiver);

    error NoMultipleMinting();
    error AlreadyTransfered();
    error OwnershipNotTrasfered();

    modifier ownershipTransferComplete() {
        if (ownershipTransfered == false) revert OwnershipNotTrasfered();
        _;
    }

    constructor() ERC721("Thanks4Donating", "TNX4D") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://example.com/nft/";
    }

    function awardItem(address receiver) external ownershipTransferComplete onlyOwner {
        if (balanceOf(receiver) > 0) revert NoMultipleMinting();

        uint256 newItemId = _tokenIds.current();

        _mint(receiver, newItemId);

        _tokenIds.increment();
        emit NewTokenMinted(newItemId, receiver);
    }

    function transferOwnership(address newOwner) public virtual override {
        if (ownershipTransfered == true) revert AlreadyTransfered();

        ownershipTransfered = true;
        super._transferOwnership(newOwner);
    }
}
