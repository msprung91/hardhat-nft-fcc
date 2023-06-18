const { network } = require("hardhat")

const DECIMALS = 18
const INITIAL_PRICE= ethers.utils.parseUnits("2000", "ether")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium. It costst 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // 1000000000 // link per gas.  calculated value based on the gas price of the chain

// ETH price goes up, i.e. $1,000,000
// ChainLink Nodes pay the gas fees to give us randomness & do external execution
// So the price of requests change based on the price of gas

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    // if (developmentChains.includes(network.name)) {
    if (network.config.chainId == 31337) {
        log("Local network detected! Deploying mocks...")
        // deploy a mock vrf coordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        await deploy ("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        })
        log("Mocks Deployed!")
        log("----------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
