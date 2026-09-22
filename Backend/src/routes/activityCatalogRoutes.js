const express = require("express");

const {
  getActivities,
  searchActivities,
  addCatalogActivityToTrip,
} = require("../controllers/activityCatalogController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/search", searchActivities);
router.get("/", getActivities);

router.post(
  "/:stopId/add",
  authMiddleware,
  addCatalogActivityToTrip
);

module.exports = router;