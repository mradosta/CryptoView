const mongoose = require("mongoose");
const { Schema } = mongoose;

const NftsSchema = new Schema({
  contract: {
    type: String,
    unique: false,
  },
  token: {
    type: String,
    unique: false,
  },
  name: {
    type: String,
    unique: false,
  },
  description: {
    type: String,
    unique: false,
  },
  image: {
    type: String,
    unique: false,
  },
});

module.exports = mongoose.model("Nfts", NftsSchema);
