const express = require("express");

const {
  getPublicTrip,
} = require("../controllers/publicTripController");

const router = express.Router();

router.get("/:shareToken", getPublicTrip);

module.exports = router;