// fulfillRandomWords

const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let randomIpfsNft, vrfCoordinatorV2Mock, mintFee, deployer
          const chainId = network.config.chainId

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              mintFee = await randomIpfsNft.getMintFee()
          })

          describe("constructor", function () {
              it("initializes the randomipfsnft correctly", async () => {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  let tokenUris = [
                      "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
                      "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
                      "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
                  ]
                  for (i in tokenUris) {
                      console.log(`Checking Token URI: ${i}:`)
                      let uri = await randomIpfsNft.getDogTokenUris(i)
                      assert.equal(uri, tokenUris[i])
                      console.log(`URI in contract ${uri} : URI in constant ${tokenUris[i]}`)
                  }
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("requestNft", () => {
              it("fails if no payment is sent with the request", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("reverts if payment amount is less than the mint fee", async () => {
                  const sendAmount = ethers.utils.parseEther("0.001")
                  await expect(
                      randomIpfsNft.requestNft({ value: mintFee.sub(sendAmount) })
                  ).to.be.revertedWith("RandomIpfsNft__NeedMoreETHSent")
              })
              it("emits an event and kicks off a random word request", async () => {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async () => {
                  await new Promise(async function (resolve, reject) {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.getDogTokenUris("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: mintFee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(5)
                  // somehow this fails
                  // assert(expectedValue, 0)
                  // but this works
                  // assert(expectedValue.toString(), "0")
                  // apparently expect works
                  expect(expectedValue).to.equal(0)
              })
              it("should return shiba inu if moddedRng < 30 and > 10", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(20)
                  assert(expectedValue, 1)
              })
              it("should return St. Bernard if moddedRng >30", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(44)
                  assert(expectedValue, 2)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(110)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
          })
      })
