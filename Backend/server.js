const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./src/config/Database");
const authRoutes = require("./src/routes/authRoutes");
const tripRoutes = require("./src/routes/tripRoutes");
const stopRoutes = require("./src/routes/stopRoutes");
const itineraryRoutes = require("./src/routes/itineraryRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const budgetRoutes = require("./src/routes/budgetRoutes");
const cityRoutes = require("./src/routes/cityRoutes");
const activityCatalogRoutes = require("./src/routes/activityCatalogRoutes");
const shareRoutes = require("./src/routes/shareRoutes");
const publicTripRoutes = require("./src/routes/publicTripRoutes");
const copyTripRoutes = require("./src/routes/copyTripRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const passwordRoutes = require("./src/routes/passwordRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const calendarRoutes = require("./src/routes/calendarRoutes");
const cityTripRoutes = require("./src/routes/cityTripRoutes");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/trips",itineraryRoutes);
app.use("/api/trips",tripRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips",stopRoutes);
app.use("/api/stops",activityRoutes);
app.use("/api/trips",budgetRoutes);
app.use("/api/cities",cityRoutes);
app.use("/api/activity-catalog", activityCatalogRoutes);
app.use("/api/trips", shareRoutes);
app.use("/api/public/trips", publicTripRoutes);
app.use("/api/public/trips", copyTripRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/password",passwordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/trips", cityTripRoutes);

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