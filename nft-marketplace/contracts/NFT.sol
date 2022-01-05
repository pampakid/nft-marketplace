/*  NFT smart contract that allows users to mint 
    unique digital assets and have ownership of them. 
    In this contract we are inheriting from the ERC721
    standard implemented by OpenZeppelin */

// SPDX-License-Identifier: MIT OR Apache 2.0
pragma solidity ^0.8.4;

// Imports 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // easy-to-use utility to increment numbers

import "hardhat/console.sol";

// Define our contract
contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // allow us to keep up with incremental values of unique identifiers for each token as we mint them
    address contractAddress; // address of the marketplace we want the nft to interact with (and viceversa)

    // Write the constructor
    constructor(address marketplaceAddress) ERC721("Metaverse", "METT") {
        contractAddress = marketplaceAddress;
    }
    // Function to mint new tokens
    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment(); // increment value starting at 0
        uint256 newItemId = _tokenIds.current();

        // Mint token
        _mint(msg.sender, newItemId); // msg.sender as the creator
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true); // give the marketplace the approval to transact this token between users from within another contract
        return newItemId; // return the itemId for later use in the user-facing app
    }
}

