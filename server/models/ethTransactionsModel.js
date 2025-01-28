const mongoose = require("mongoose");
const { Schema } = mongoose;

const EthTransactionsSchema = new Schema({
  hash: {
    type: String,
    unique: true,
  },
  from: {
    type: String,
    unique: false,
  },
  to: {
    type: String,
    unique: false,
  },
  value: {
    type: Number,
    required: false,
  },
  gas: {
    type: Number,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  }
});

module.exports = mongoose.model("EthTransactions", EthTransactionsSchema);
