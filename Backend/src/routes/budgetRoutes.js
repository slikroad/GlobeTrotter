const express = require("express");

const {
  getBudget,
} = require("../controllers/budgetController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:tripId/budget", getBudget);

module.exports = router;