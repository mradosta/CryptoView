const dotenv = require("dotenv");
dotenv.config();

const { Web3 } = require('web3');
const nftModel = require("../models/nftModel.js");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_HTTPS));


// 4. Token Balance Lookup:

// The Challenge: Build an API endpoint that accepts a token contract address and a wallet address. It should query the blockchain (using web3.js) to retrieve the balance of the specified token held by the wallet address and return the balance.
// Focus: Understanding of token contracts and token balance retrieval through web3.js.

// https://sepolia.etherscan.io/token/0xbbd3edd4d3b519c0d14965d9311185cfac8c3220?a=0xb444168cec8c5f0d8e8737e2c6de50bf8fd34dec
const tokenBalance = async (req, res) => {

  // ERC-20 ABI (only the required balanceOf and decimals methods)
  const ERC20_ABI = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      type: "function",
    },
  ];

  const { contractAddress, walletAddress } = req.params;

  if (!web3.utils.isAddress(contractAddress) || !web3.utils.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid contract or wallet address' });
  }

  try {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, contractAddress);

    // Fetch balance and decimals
    const balance = BigInt(await tokenContract.methods.balanceOf(walletAddress).call());

    // Convert balance based on token decimals
    const decimals = Number(await tokenContract.methods.decimals().call());

    // Adjust balance as a string to avoid limitations with BigInt
    const adjustedBalance = Number(balance) / Math.pow(10, decimals);


    res.json({ contractAddress, walletAddress, balance: adjustedBalance });
    // res.json({ contractAddress, walletAddress, balance: decimals });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ error: 'Failed to fetch token balance' });
  }
};


// 5. Basic Smart Contract Interaction:

// The Challenge: Create a pre-deployed simple ERC20 token contract on a testnet. Build an API endpoint that allows users to transfer tokens between wallets using the contract. The endpoint should update the MongoDB database with the latest transaction data.
// Focus: Basic understanding of smart contract interactions, transaction handling, and integration with a blockchain.

// API endpoint to transfer tokens
const transferTokens = async (req, res) => {

  const ERC20_ABI = [
    {
      constant: false,
      inputs: [
        { name: "_to", type: "address" },
        { name: "_value", type: "uint256" }
      ],
      name: "transfer",
      outputs: [{ name: "", type: "bool" }],
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      type: "function"
    }
  ];

  const { walletAddressTo, amount } = req.body;

  if (!web3.utils.isAddress(walletAddressTo)) {
    return res.status(400).json({ error: 'Invalid recipient address' });
  }

  try {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, process.env.ERC20_CONTRACT_ADDRESS);
    const account = web3.eth.accounts.privateKeyToAccount(process.env.MAIN_ACCOUNT_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);


    const fromAddress = web3.eth.accounts.privateKeyToAccount(process.env.MAIN_ACCOUNT_PRIVATE_KEY).address;
    const decimals = await tokenContract.methods.decimals().call();
    const adjustedAmount = web3.utils.toBN(amount).mul(web3.utils.toBN(10 ** decimals));

    const tx = {
      from: fromAddress,
      to: process.env.TOKEN_CONTRACT_ADDRESS,
      gas: 200000,
      data: tokenContract.methods.transfer(walletAddressTo, adjustedAmount).encodeABI()
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.MAIN_ACCOUNT_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.json({ success: true, transactionHash: receipt.transactionHash });
  } catch (error) {
    console.error('Amount failed:', error);
    res.status(500).json({ error: 'Amount transfer failed' });
  }
};



// 1. NFT Metadata Retrieval and Storage:

// The Challenge: Create an API endpoint that accepts an NFT contract address and token ID. It should retrieve the metadata (name, description, image URL) from the blockchain using web3.js, store it in MongoDB, and return the metadata to the user.
// Focus: Demonstrates understanding of web3.js interaction with smart contracts, handling data from blockchain, and basic database integration.

const nftMetadata = async (req, res) => {

  const ERC721_ABI = [
    {
      constant: true,
      inputs: [{ name: "_tokenId", type: "uint256" }],
      name: "tokenURI",
      outputs: [{ name: "", type: "string" }],
      type: "function"
    }
  ];

  const { contract, token } = req.params;

  if (!web3.utils.isAddress(contract)) {
    return res.status(400).json({ error: 'Invalid contract address' });
  }

  // search in the local cache
  const tokenInDb = await nftModel.findOne({ contract, token }).select({'name': 1, 'description': 1, 'image': 1, '_id': 0});
  if (tokenInDb) {
    return res.status(200).json(tokenInDb);
  }

  // Not in local cache, search the blockchain
  try {
    // Create contract instance
    const nftContract = new web3.eth.Contract(ERC721_ABI, contract);

    // Get tokenURI from the contract
    const tokenMetadata = JSON.parse(await nftContract.methods.tokenURI(token).call());

    // add doc to db
    const nft = await nftModel.create({contract, token, ...tokenMetadata});
    res.status(200).json(tokenMetadata);

  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch NFT metadata' });
  }
};


module.exports = { nftMetadata, tokenBalance, transferTokens };