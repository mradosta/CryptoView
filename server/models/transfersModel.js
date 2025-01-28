const mongoose = require("mongoose");
const { Schema } = mongoose;

const TransfersSchema = new Schema({
  from: {
    type: String,
    unique: false,
  },
  to: {
    type: String,
    unique: false,
  },
  amount: {
    type: String,
    unique: false,
  },
  transactionHash: {
    type: String,
    unique: false,
  },
  timestamp: {
    type: String,
    unique: false,
  },
});

module.exports = mongoose.model("Transfers", TransfersSchema);