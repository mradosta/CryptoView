const EthTransactionsModel = require("../models/ethTransactionsModel.js");
const axios = require('axios');
const moment = require('moment');

// 2. Simple Cryptocurrency Transaction Tracking:

// The Challenge: Build an API endpoint that accepts a cryptocurrency address (Ethereum, for example). It should retrieve the last 5 transactions for that address from a blockchain explorer API (e.g., Etherscan) and store them in MongoDB. Allow users to query for transactions by address and date range.
// Focus: Exposes knowledge of external APIs, data parsing, and efficient database storage.
const getTransactions = async (req, res) => {
  try {
    const { address, from, to } = req.params;
    const getLatestTransactions = async(address, from, to, count = 5) => {
      try {
        const q = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
        const response = await axios.get(q);

        if (response.data.status !== '1') {
          throw new Error(response.data.message || 'Error fetching transactions');
        }

        let transactions = [ ];
        response.data.result.forEach((tx, index) => {
          transactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gas: tx.gasUsed,
            date: moment(new Date(tx.timeStamp * 1000)).format('YYYY-MM-DD HH:mm:SS')
          });
        });

        transactions = transactions.filter(e => e.date >= from && e.date <= to).slice(0, count);
        try {
          await EthTransactionsModel.insertMany(transactions, { ordered: false });
        } catch(err) {
          if (err.errorResponse.code != 11000) { //ignore (duplicate)
            throw new Error(err.errorResponse.message || 'Error saving transactions');
          }
        }

        return transactions;

      } catch (error) {
        console.error(error);
        console.error('Error:', error.message);
      }
    };

    const result = await getLatestTransactions(address, from, to, 5);
    res.status(200).json(result);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error });
  }
};

module.exports = { getTransactions };
