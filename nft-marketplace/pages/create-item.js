import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

/* Create variable called client to set and pin items to ipfs */
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
// Import addresses
import {
    nftaddress, nftmarketaddress
} from '../config.js'

// Import ABIs
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import createStatsCollector from 'mocha/lib/stats-collector'

// Define default export 
export default function CreateItem () {
    const [fileUrl, setFileUrl] = useState(null) // ipfs file we are going to allow the user to upload
    const[formInput, updateFormInput] = useState({ price: '', name: '', description: '' }) // allow user to set the price, name and desc of the nft
    const router = useRouter() 

    // Get url of NFT once created
    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log( `received: ${prog}` )
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileUrl(url)
        } catch (e) {
            console.log('Error uploading file: ', e)
        }
    }

    /* Create function to allow user to list an item for sale */
    /* We are going to break it up on two functions for that: 
            1. Creating an item and saving it to ipfs (reference to the NFT)
            2. Listing the item for sale */
    async function createItem() {
        const { name, description, price } = formInput // destructure the name description and price
        // First form of validation, we don't want to let users list items that don't have this available
        if (!name || !description || !price || !fileUrl) return 
        // Save value to IPFS in variable called data
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        // Save data to IPFS using a try&catch
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            /* after file is uploaded to IPFS hte URL to save it on Polygon */ 
            createSale(url)
        } catch (error) {
            console.log('Error uploading file: ', error)
        }
    } 

    async function createSale() {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect() // connect
        const provider = new ethers.providers.Web3Provider(connection) // get provider
        const signer = provider.getSigner() // get signer

        /* We are going to be interacting with 2 contracts */
        let contract = new ethers.Contract(nftaddress, NFT.abi, signer) // nft contract
        let transaction = await contract.createToken(url) // create token
        let tx = await transaction.wait() // wait for transaction to succeed
        /* Modify the events array we get back to use its values */
        let event = tx.events[0] // reference to the events array
        let value = event.args[2] // get the third value out of args
        let tokenId = value.toNumber() // turn that value into a number (rn its a BigNumber) to create the reference to the token id

        /* Get reference to the price we want to sell the item for */
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        /* Move the reference of the contract from the nft to the nft market address and market contract  */
        contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString() // send the value within this transaction to the contract

        transaction = await contract.createMarketItem( // wait contract.createMarketItem to succeed
            nftaddress, tokenId, price, { value: listingPrice } // bring data
        )
        await transaction.wait()

        /* Reroute user to anothe page */
        router.push('/')
    }
    /* Return UI */
    return(
        /* Return a form for the user to interact */
        <div className="w-1/2 flex flex-col pb-12">
            <input // Set name
                placeholder="Asset Name"
                className="mt-8 border rounded p-4"
                onChange={ e => updateFormInput({ ...formInput, name: e.target.value })} // update local form input variable only changing the name
            />
            <textarea // Set description
                placeholder="Asset Description"
                className="mt-2 border rounded p-4"
                onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
            />
            <input // Set price
                placeholder="Asset Price (MATIC)"
                className="mt-2 border rounded p-4"
                onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
            />
            <input // Show the file input
                type="file"
                name="Asset"
                className="my-4"
                onChange={onChange} // instead of passing a value, we call onChange directly
            />
            {   /* Show preview of file */
                fileUrl && ( // if there is a file Url, show the image as preview
                    <img className="rounded mt-4" width="350" src={fileUrl} />
                )
            } 
            <button 
                onClick={createItem}
                className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
            > 
                Create Digital Asset
            </button>
        </div>
    )
} 