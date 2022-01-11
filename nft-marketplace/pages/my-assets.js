import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {
    nftmarketaddress, nftaddress
}   from '../config'

/* Import ABIs */ 
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import { loadDefaultErrorComponents } from 'next/dist/server/load-components'
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from 'constants'

/* Main component MyAssets */
export default function MyAssets() {
    const [assets, setAssets] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')
    useEffect(() => {
        loadNfts()
    }, [])
    /* Load NFTs function --different to the one in index.js */
    async function loadNFTs() {
        const web3Modal = new Web3Modal() // using web3modal
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()
        /*  We use the signer to get a reference to the marketContract because we need
            to know who the msg.sender is. Else, if the user navigates to this page
            without being auth with a wallet, they'll auto see the wallet modal pop up */
        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const data = await marketContract.fetchMyNFTs() // fetch market items
        /* Map over items and update */
        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ethers')
            let item = {
                price, 
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image
            }
            return item
        }))
        setNfts(items)
        setLoadingState('loaded')
    }
}