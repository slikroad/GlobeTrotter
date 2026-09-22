const pool = require("../config/Database");

const addCityToTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const {
      city_name,
      country,
      start_date,
      end_date
    } = req.body;

    if (!city_name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "City name, start date and end date are required",
      });
    }

    // Check that trip belongs to logged-in user
    const [trips] = await pool.query(
      `SELECT id
       FROM trips
       WHERE id = ?
       AND user_id = ?`,
      [tripId, req.user.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Find next stop order
    const [orderResult] = await pool.query(
      `SELECT
        COALESCE(MAX(stop_order), 0) + 1 AS next_order
       FROM trip_stops
       WHERE trip_id = ?`,
      [tripId]
    );

    const nextOrder = orderResult[0].next_order;

    // Add city as a trip stop
    const [result] = await pool.query(
      `INSERT INTO trip_stops
      (
        trip_id,
        city_name,
        country,
        start_date,
        end_date,
        stop_order
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        city_name,
        country || null,
        start_date,
        end_date,
        nextOrder
      ]
    );

    res.status(201).json({
      success: true,
      message: "City added to trip successfully",
      stopId: result.insertId,
    });

  } catch (error) {
    console.error("Add city to trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add city to trip",
    });
  }
};

module.exports = {
  addCityToTrip,
};