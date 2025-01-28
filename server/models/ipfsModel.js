const mongoose = require("mongoose");
const { Schema } = mongoose;

const IpfsSchema = new Schema({
  name: {
    type: String,
    unique: false,
  },
  cid: { //hash
    type: String,
    unique: true,
  }
});

module.exports = mongoose.model("Ipfs", IpfsSchema);
