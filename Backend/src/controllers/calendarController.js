const pool = require("../config/Database");

const getTripCalendar = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip belongs to logged-in user
    const [trips] = await pool.query(
      `SELECT
        id,
        name,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
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

    const trip = trips[0];

    // Get all stops
    const [stops] = await pool.query(
      `SELECT
        id,
        city_name,
        country,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        stop_order
       FROM trip_stops
       WHERE trip_id = ?
       ORDER BY stop_order ASC`,
      [tripId]
    );

    // Get activities for every stop
    for (const stop of stops) {

      const [activities] = await pool.query(
        `SELECT
          id,
          name,
          type,
          description,
          TIME_FORMAT(start_time, '%H:%i') AS start_time,
          duration_minutes,
          cost,
          activity_order
         FROM activities
         WHERE stop_id = ?
         ORDER BY activity_order ASC`,
        [stop.id]
      );

      stop.activities = activities;
    }

    res.json({
      success: true,
      trip,
      calendar: stops,
    });

  } catch (error) {
    console.error("Calendar error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load trip calendar",
    });
  }
};

module.exports = {
  getTripCalendar,
};