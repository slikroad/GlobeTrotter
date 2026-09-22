const express = require("express");

const {
  addCityToTrip,
} = require("../controllers/cityTripController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:tripId/cities", addCityToTrip);

module.exports = router;