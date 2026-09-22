const express = require("express");

const {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  reorderActivities,
} = require("../controllers/activityController");


const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:stopId/activities", createActivity);

router.get("/:stopId/activities", getActivities);

router.put(
  "/:stopId/activities/reorder",
  reorderActivities
);
router.put(
  "/:stopId/activities/:activityId",
  updateActivity
);
router.delete(
  "/:stopId/activities/:activityId",
  deleteActivity
);


module.exports = router;