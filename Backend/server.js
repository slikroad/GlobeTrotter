const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./src/config/Database");

const app = express();

app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("GlobeTrotter API is running!");
// });

app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "Database connected successfully!",
      data: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`GlobeTrotter server running on port ${PORT}`);
});