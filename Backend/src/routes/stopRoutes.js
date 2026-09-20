const express = require("express");

const {
  createStop,
  getStops,
} = require("../controllers/stopController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All stop routes require login
router.use(authMiddleware);

// Add a stop to a trip
router.post("/:tripId/stops", createStop);

// Get all stops for a trip
router.get("/:tripId/stops", getStops);

module.exports = router;
