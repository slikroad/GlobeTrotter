const express = require("express");

const {
  getCities,
  searchCities,
  getCityById,
} = require("../controllers/cityController");

const router = express.Router();

router.get("/search", searchCities);
router.get("/:id", getCityById);
router.get("/", getCities);

module.exports = router;