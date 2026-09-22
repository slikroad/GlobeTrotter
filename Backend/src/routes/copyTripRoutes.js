const express = require("express");

const {
  copyPublicTrip,
} = require("../controllers/copyTripController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:shareToken/copy", copyPublicTrip);

module.exports = router;