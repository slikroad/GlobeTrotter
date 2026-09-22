const pool = require("../config/Database");

const getPublicTrip = async (req, res) => {
  try {
    const { shareToken } = req.params;

    // Get public trip
    const [trips] = await pool.query(
      `SELECT
        id,
        name,
        start_date,
        end_date,
        description,
        cover_photo
       FROM trips
       WHERE share_token = ?
       AND is_public = TRUE`,
      [shareToken]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Public trip not found",
      });
    }

    const trip = trips[0];

    // Get stops
    const [stops] = await pool.query(
      `SELECT
        id,
        city_name,
        country,
        start_date,
        end_date,
        stop_order
       FROM trip_stops
       WHERE trip_id = ?
       ORDER BY stop_order ASC`,
      [trip.id]
    );

    // Get activities for each stop
    for (const stop of stops) {
      const [activities] = await pool.query(
        `SELECT
          id,
          name,
          type,
          description,
          start_time,
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
      stops,
    });

  } catch (error) {
    console.error("Get public trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch public trip",
    });
  }
};

module.exports = {
  getPublicTrip,
};