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


const updateActivity = async (req, res) => {
  try {
    const { stopId, activityId } = req.params;

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

    // Check that the activity belongs to the logged-in user
    const [activities] = await pool.query(
      `SELECT a.id
       FROM activities a
       JOIN trip_stops ts ON a.stop_id = ts.id
       JOIN trips t ON ts.trip_id = t.id
       WHERE a.id = ?
         AND a.stop_id = ?
         AND t.user_id = ?`,
      [activityId, stopId, req.user.id]
    );

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    await pool.query(
      `UPDATE activities
       SET name = ?,
           type = ?,
           description = ?,
           start_time = ?,
           duration_minutes = ?,
           cost = ?,
           activity_order = ?
       WHERE id = ?`,
      [
        name,
        type || null,
        description || null,
        start_time || null,
        duration_minutes || null,
        cost || 0,
        activity_order || 1,
        activityId,
      ]
    );

    res.json({
      success: true,
      message: "Activity updated successfully",
    });

  } catch (error) {
    console.error("Update activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update activity",
    });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { stopId, activityId } = req.params;

    // Check that the activity belongs to the logged-in user
    const [activities] = await pool.query(
      `SELECT a.id
       FROM activities a
       JOIN trip_stops ts ON a.stop_id = ts.id
       JOIN trips t ON ts.trip_id = t.id
       WHERE a.id = ?
         AND a.stop_id = ?
         AND t.user_id = ?`,
      [activityId, stopId, req.user.id]
    );

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    await pool.query(
      `DELETE FROM activities
       WHERE id = ? AND stop_id = ?`,
      [activityId, stopId]
    );

    res.json({
      success: true,
      message: "Activity deleted successfully",
    });

  } catch (error) {
    console.error("Delete activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete activity",
    });
  }
};

const reorderActivities = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { stopId } = req.params;
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Activities array is required",
      });
    }

    // Check that the stop belongs to the logged-in user
    const [stops] = await connection.query(
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

    await connection.beginTransaction();

    for (let i = 0; i < activities.length; i++) {
      await connection.query(
        `UPDATE activities
         SET activity_order = ?
         WHERE id = ? AND stop_id = ?`,
        [
          i + 1,
          activities[i].id,
          stopId,
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Activities reordered successfully",
    });

  } catch (error) {
    await connection.rollback();

    console.error("Reorder activities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reorder activities",
    });

  } finally {
    connection.release();
  }
};

module.exports = {
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  reorderActivities,
};