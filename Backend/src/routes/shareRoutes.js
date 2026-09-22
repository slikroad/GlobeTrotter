const express = require("express");

const {
  makeTripPublic,
} = require("../controllers/shareController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/:tripId/share", makeTripPublic);

module.exports = router;