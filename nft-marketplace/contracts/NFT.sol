// contracts /NFT.sol
// SPDX-License-Identifier: MIT OR Apache 2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

// Define contract
contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // allow us to keep up with incremental values of unique identifiers for each token as we mint them
    address contractAddress; // address of the marketplace we want the nft to interact with (and viceversa)

    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "METT") {
        contractAddresss = marketplaceAddress;
    }
    // Mint new tokens
    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(msg.sender, newItemId); // msg.sender as the creator
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true); // give the marketplace the approval to transact

        return newItemId; // return the new itemId for later user in the user-facing app
    }
}

