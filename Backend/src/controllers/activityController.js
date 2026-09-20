const pool = require("../config/Database");

// Add an activity
const createActivity = async (req, res) => {
  try {
    const { stopId } = req.params;

    const {
      name,
      type,
      description,
      start_time,
      duration_minutes,
      cost,
      activity_order,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Activity name is required",
      });
    }

    // Make sure this stop belongs to the logged-in user
    const [stops] = await pool.query(
      `SELECT ts.id
       FROM trip_stops ts
       JOIN trips t ON ts.trip_id = t.id
       WHERE ts.id = ? AND t.user_id = ?`,
      [stopId, req.user.id]
    );

    if (stops.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    const [result] = await pool.query(
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
        stopId,
        name,
        type || null,
        description || null,
        start_time || null,
        duration_minutes || null,
        cost || 0,
        activity_order || 1,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Activity added successfully",
      activityId: result.insertId,
    });

  } catch (error) {
    console.error("Create activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add activity",
    });
  }
};


// Get activities for a stop
const getActivities = async (req, res) => {
  try {
    const { stopId } = req.params;

    // Make sure the stop belongs to the logged-in user
    const [stops] = await pool.query(
      `SELECT ts.id
       FROM trip_stops ts
       JOIN trips t ON ts.trip_id = t.id
       WHERE ts.id = ? AND t.user_id = ?`,
      [stopId, req.user.id]
    );

    if (stops.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    const [activities] = await pool.query(
      `SELECT
        id,
        stop_id,
        name,
        type,
        description,
        start_time,
        duration_minutes,
        cost,
        activity_order,
        created_at
       FROM activities
       WHERE stop_id = ?
       ORDER BY activity_order ASC`,
      [stopId]
    );

    res.json({
      success: true,
      activities,
    });

  } catch (error) {
    console.error("Get activities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};


module.exports = {
  createActivity,
  getActivities,
};