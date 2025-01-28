const express = require("express");
const {
  read,
  write,
} = require("../controllers/ipfsController.js");
// const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

router.post("/", write);
router.get("/:name", read);

module.exports = router;
