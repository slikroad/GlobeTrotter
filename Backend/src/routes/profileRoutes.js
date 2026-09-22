const express = require("express");

const {
  getProfile,
  updateProfile,
  deleteAccount,
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/", updateProfile);
router.delete("/", deleteAccount);

module.exports = router;