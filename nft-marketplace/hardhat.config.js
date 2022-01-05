/* hardhat.config.js */
require("@nomiclabs/hardhat-waffle")

// Configure HardHat to work with Polygon
const fs = require("fs") // Require file services is a utility that allows us to read from the file server
const privateKey = fs.readFileSync(".secret").toString().trim()
const projectId = "70714ef5305844599d7fcefc13008a85"

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`
    },
    mainnet: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}