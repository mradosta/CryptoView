const express = require("express");
const {
  tokenBalance,
  transferTokens,
  nftMetadata
} = require("../controllers/TokensController.js");
const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

// router.post("/", saveFile);
router.get("/nft-metadata/:contract/:token", nftMetadata);
router.get("/balance/:contractAddress/:walletAddress", tokenBalance);
router.post("/transfer", transferTokens);

module.exports = router;