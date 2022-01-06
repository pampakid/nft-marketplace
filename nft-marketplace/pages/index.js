// import Head from 'next/head'
// import Image from 'next/image'
// import { div } from 'prelude-ls'
// import styles from '../styles/Home.module.css'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react' // hooks. useState --> keep up with local states. useEffect --> invoke a function when the component loads
import axios from 'axios' // data fetching library
import Web3Modal from 'web3modal' // connect to someone's ethereum wallet

/* Import references to addresses */
import {
  nftaddress, nftmarketaddress
} from '../config.js'

/* Import ABIs for the ether client to interact with the contracts*/
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function Home() {
  const [nfts, setNfts] = useState([]) // empty array of nfts and a function to reset the array of nfts 
  const [loadingState, setLoadingState] = useState('not-loaded') // loading state is a variable and the setLoadingState will let us update the variable. default not-loaded
  
  useEffect(() => {
    loadNFTs()
  }, [])

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    // Map over the items
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId:      i.tokenId.toNumber(),
        seller:       i.seller,
        owner:        i.owner,
        image:        meta.data.image,
        name:         meta.data.name,
        description:  meta.data.description
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }

  /* Give user the ability to buy an NFT */
  async function buyNFT(nft) {
    const web3modal = new Web3Modal() // let user connect to their wallet
    const connection = await web3modal.connect() 
    const provider = new ethers.providers.Web3Provider(connection) // create provider using users' connection

    const signer = provider.getSigner() // we need the user to sign and execute an actual transaction
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer) // pass signer in the market reference

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    
    /* Create market sale using our Market.sol function */
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })
    await transaction.wait() // wait until the transaction is finished

    loadNFTs() // update NFTs
  }

  if (loadingState === 'loaded' && !nfts.length) return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  )

  return (
    <div className={styles.container}>
      <h1>Home</h1>
    </div>
  )
}
