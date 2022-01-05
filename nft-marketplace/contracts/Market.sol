/*  Marketplace contract that allows users to mint a token, 
    put it up for sale, and sell it to another user */

// SPDX-License-Identifier: MIT OR Apache 2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

/* Declare contracts */
contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    // Create variable for the owner of the contract
    address payable owner;
    // Set listing price
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint    itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool    sold;
    }
    
    // Mapping for the MarketItem via idToMarketItem
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Event for when a MarketItem is created
    event MarketItemCreated (
        uint    indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool    sold
    );

    // Returns the listing price of the contract 
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // Places an item for sale on the marketplace
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment()
        uint256 itemId = _itemIds.current();
        // Create mapping for the MarketItem
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );
        // Transfer ownership of the NFT to the contract itself. Later the contract will transfer to the buyer
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        // Emit the event that we created
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }
    
    /* Places an item for sale on the marketplace */
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant { // the nonreentrant is going to prevent a reentry
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current(); // id for the marketplace itema that is going for sale rn
        // Create mapping for this MarketItem
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)), // rn is nobody so it's set to an empty address
            price,
            false
        );
        // Transfer ownership of the NFT to the contract itself. Later the contract will transfer to the buyer
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        // Emit the event that we created
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function createMarketSale(
        address nftContract,
        uint256 itemId // we don't need to pass the price cause it's already known in the contract
    ) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        // Transfer the value of the transaction (send money to seller)
        idToMarketItem[itemId].seller.transfer(msg.value);
        // Transfer the ownership of the token to the msg.sender (from the contract address to the buyer)
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        // Update mapping
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment(); // increment number of items sold by 1
        // Pay the owner of the contract (can be the commission of the market owner)
        payable(owner).transfer(listingPrice);
    }

    // Create functions for views of our NFTs
    /* Returns all unsold market items */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;  // keep up with a local value for incrementing a number when looping over an array
        // Create empty array called 'items'
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        // Loop over the number of items that have been created
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {    // check to see if the items is unsold-- == address(0)
                uint currentId = i + 1;  // id of the item we are interacting with
                MarketItem storage currentItem = idToMarketItem[currentId]; // mapping the currentId to currentItem
                items[currentIndex] = currentItem; // set the value of the item at this index to be the current value
                currentIndex += 1; // update counter
            }
        }
        return items; // return array from the loop
    }
    
    /* Returns only items that a user has purchased */
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current(); // similarly to how we kept the item count
        uint itemCount = 0;
        uint currentIndex = 0;

        // Loop over all of the items to check ownership from a user
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }
        // Create and populate an array with a user's items
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = i + 1;
                
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem; // Insert Item in the array
                currentIndex += 1; // increment the current Index
            }
        }
        return items;
    }

    /* Returns only items a user has created */
    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }
        // Create and populate an array with a items created by user
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }   
        }
        return items;
    }
}