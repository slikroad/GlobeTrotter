const pool = require("../config/Database");

const copyPublicTrip = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { shareToken } = req.params;

    // Find public trip
    const [trips] = await connection.query(
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

    const originalTrip = trips[0];

    await connection.beginTransaction();

    // Create copied trip
    const [tripResult] = await connection.query(
      `INSERT INTO trips
      (
        user_id,
        name,
        start_date,
        end_date,
        description,
        cover_photo,
        is_public
      )
      VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
      [
        req.user.id,
        `${originalTrip.name} (Copy)`,
        originalTrip.start_date,
        originalTrip.end_date,
        originalTrip.description,
        originalTrip.cover_photo,
      ]
    );

    const newTripId = tripResult.insertId;

    // Get original stops
    const [stops] = await connection.query(
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
      [originalTrip.id]
    );

    for (const stop of stops) {
      const [stopResult] = await connection.query(
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
          newTripId,
          stop.city_name,
          stop.country,
          stop.start_date,
          stop.end_date,
          stop.stop_order,
        ]
      );

      const newStopId = stopResult.insertId;

      // Get activities for this stop
      const [activities] = await connection.query(
        `SELECT
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

      for (const activity of activities) {
        await connection.query(
          `INSERT INTO activities
          (
            stop_id,
            name,
            type,
            description,
            start_time,
            duration_minutes,
            cost,
            activity_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newStopId,
            activity.name,
            activity.type,
            activity.description,
            activity.start_time,
            activity.duration_minutes,
            activity.cost,
            activity.activity_order,
          ]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Trip copied successfully",
      tripId: newTripId,
    });

  } catch (error) {
    await connection.rollback();

    console.error("Copy public trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to copy trip",
    });

  } finally {
    connection.release();
  }
};

module.exports = {
  copyPublicTrip,
};