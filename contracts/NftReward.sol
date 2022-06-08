//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftReward is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(address => bool) private _minted;

    error NoMultipleMinting();

    modifier firstMint(address _address) {
        if (_minted[_address] == true) revert NoMultipleMinting();
        _;
    }

    constructor() ERC721("Thanks4Donating", "TNX4D") {}

    function awardItem(address _address, string memory tokenURI)
        external
        onlyOwner
        firstMint(_address)
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _minted[_address] = true;

        _mint(_address, newItemId);
        _setTokenURI(newItemId, tokenURI);

        _tokenIds.increment();
        return newItemId;
    }
}
