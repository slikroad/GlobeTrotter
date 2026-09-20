const pool = require("../config/Database");

// Add a stop to a trip
const createStop = async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      city_name,
      country,
      start_date,
      end_date,
      stop_order,
    } = req.body;

    if (!city_name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "City name, start date and end date are required",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Make sure the trip belongs to the logged-in user
    const [trips] = await pool.query(
      "SELECT id FROM trips WHERE id = ? AND user_id = ?",
      [tripId, req.user.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO trip_stops
      (trip_id, city_name, country, start_date, end_date, stop_order)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        city_name,
        country || null,
        start_date,
        end_date,
        stop_order || 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Stop added successfully",
      stopId: result.insertId,
    });
  } catch (error) {
    console.error("Create stop error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add stop",
    });
  }
};


// Get all stops for a trip
const getStops = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Make sure the trip belongs to the logged-in user
    const [trips] = await pool.query(
      "SELECT id FROM trips WHERE id = ? AND user_id = ?",
      [tripId, req.user.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const [stops] = await pool.query(
      `SELECT id, trip_id, city_name, country,
       DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
       DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
       stop_order, created_at
FROM trip_stops
       WHERE trip_id = ?
       ORDER BY stop_order ASC`,
      [tripId]
    );

    res.json({
      success: true,
      stops,
    });
  } catch (error) {
    console.error("Get stops error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stops",
    });
  }
};


module.exports = {
  createStop,
  getStops,
};