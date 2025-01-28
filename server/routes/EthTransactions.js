const express = require("express");
const {
  getTransactions
} = require("../controllers/ethTransactionsController.js");
const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

router.get("/:address/:from/:to", getTransactions);

module.exports = router;
