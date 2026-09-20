const express = require("express");

const {
  createActivity,
  getActivities,
} = require("../controllers/activityController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:stopId/activities", createActivity);
router.get("/:stopId/activities", getActivities);

module.exports = router;