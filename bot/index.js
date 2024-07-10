// index.js
require('dotenv').config();
const { ethers } = require('ethers');
const pingpong_abi = require("./PingPongABI.json")
const { Sequelize } = require('sequelize');
const fs = require('fs');
const BlockchainData= require("./state.js");
const { sign } = require('crypto');

//Some initialization var on the bot


async function main() {


//smart contract address
    pingpong_address=process.env.PING_PONG_ADDRESS
    const provider = new ethers.providers.InfuraProvider("sepolia",process.env.INFURA_API_KEY);
    const signerWallet=  new ethers.Wallet(process.env.PRIV_KEY,provider);
    const pingpong_contract = new ethers.Contract(pingpong_address, pingpong_abi,provider);
    const pingpong_contractWithSigner= pingpong_contract.connect(signerWallet);

    //We use this class to preserve state. It's simply a file on the computer, since we see no need for a DB. Anyway, it's very easy
    //change the file for a DB if it's necessary
    //KISS Principle
    const blockchainData = new BlockchainData();


    //This function it's called when the bot is more than 2 blocks behind the Sepolia Network
    //This means that the bot has stop receiving blocks for some reason (network failure, bot update,etc)
    //If this happens, the bot will call and process the missing ping events on the blocks
    const processBlocks=async()=> {
        const lastBlock = blockchainData.getLastAddedBlock();
        const currentBlock = await provider.getBlockNumber();
        const events= await pingpong_contract.queryFilter("Ping",lastBlock,currentBlock);
        for (const event of events) {
            blockchainData.addPendingPong(event.transactionHash);
            console.log("Event added:" + event.transactionHash);
        }
        blockchainData.setLastAddedBlock(currentBlock);
        console.log("Sync to block:" + currentBlock);
    }

    //This function will take the first pending pong and send the transaction
    //I will check what's the last sent nonce by the sending wallet, and the transactinCount for the same wallet
    //If the sent nonce is higher than the transaction count, it means that a transaction is still pending
    //We're assuming that the wallet is used only to send Pong transaction
    const sendPong = async () => {
        if(blockchainData.getState()=="running") {
            blockchainData.setState("checking_queue");
            const pendingPongs= blockchainData.getPendingPongs();
            if(pendingPongs.length >=1) {
                blockchainData.setState("sending_transaction");
                const pong= blockchainData.firstPendingPong();
                blockchainData.queuePong(pong);
                const tx = await pingpong_contractWithSigner.pong(pong);
                const receipt = await tx.wait();
                console.log("Tx sent");
                console.log(receipt)
                if(receipt['status']==1) {
                    console.log(pong + " sent succesfull")
                    blockchainData.sentPong(pong);
                    blockchainData.setState("running");
                } else {
                    console.log("Transaction Error");
                    blockchainData.unqueuePong(pong);
                    blockchainData.setState("running");
                }
                
            } else {
                blockchainData.setState("running");
            }
        } 
    }

    //We set the block to start just once
    const start = async () => {
        if(blockchainData.getState()=="never_run") {
            const block = await provider.getBlockNumber();
            blockchainData.setLastAddedBlock(block);
            console.log("Bot first run");
        } else {
            console.log("Restarting Bot");
        }
        blockchainData.setState("running");
        console.log("running");
    }

    start();

    //This calls the sendPong function every 10 secs
    setInterval(sendPong,10000);
    setInterval(processBlocks,20000);

}


main().catch(console.error);