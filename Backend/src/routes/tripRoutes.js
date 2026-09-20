const express = require("express");

const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");

const authMiddleware = require("../middleware/authMiddleware");
const { route } = require("./authRoutes");

const router = express.Router();

// All trip routes require login
router.use(authMiddleware);

// Create a trip
router.post("/", createTrip);

// Get all trips of logged-in user
router.get("/", getTrips);

// Get one trip
router.get("/:id", getTripById);

router.put("/:id", updateTrip);

router.delete("/:id",deleteTrip);

module.exports = router;