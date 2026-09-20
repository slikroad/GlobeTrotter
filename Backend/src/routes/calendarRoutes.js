const express = require("express");

const {
  getTripCalendar,
} = require("../controllers/calendarController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:tripId", getTripCalendar);

module.exports = router;