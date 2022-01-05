/* Test contracts with key functionalities like minting a token, 
  putting it up for sale,   selling it to a user, and querying for tokens. */

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    // Create test that simulated deploying both contracts, create an NFT, put it on sale and purchase it from someone else 

    // Get a reference to the market contract
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy() // deploy the market
    await market.deployed() // wait for it to finish being deployed   
    // Get a reference to the address to which it was deployed (we need the value of the market address)
    const marketAddress = market.address

    // Deploy the NFT contract
    const NFT = await ethers.getContractFactory("NFT")
    const nft = await NFT.deploy(marketAddress) // pass in the market address to the constructor of the NFT
    await nft.deployed()
    // Reference to the NFT contract itself
    const nftContractAddress = nft.address

    // Interact with the contracts already deployed

    // Get reference to the value of the listing price
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString() // turn it into a string
    
    // Value for how much we are selling the item for
    const auctionPrice = ethers.utils.parseUnits('1', 'ether') // use ether utils to work with whole units instead of decimals (in our case Matic has 18 decimal places)

    // Create tokens interacting with the NFT contract
    await nft.createToken("https://www.mytokenlocation.com")
    await nft.createToken("https://www.mytokenlocation2.com")

    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })

    // Set up test accounts using the ethers library
    // We ignore the first address using an "_" cause it's gonna be used when deploying
    // We get a reference to the buyer address because we don't want the buyer to be the same as the seller ("_") 
    const [_, buyerAddress] = await ethers.getSigners()
    // Use the buyerAddress to connect to the market and sell nft 1
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice})

    // Test querying for these market items
    // Variable called items
    items = await market.fetchMarketItems()

    console.log('items: ', items)

  })
})