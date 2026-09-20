const express = require("express");

const {
  generateItinerary,
  saveItinerary,
} = require("../controllers/itineraryController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate", generateItinerary);
router.post("/save", saveItinerary);

module.exports = router;