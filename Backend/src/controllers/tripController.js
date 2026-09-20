const pool = require("../config/Database");

// Create a new trip
const createTrip = async (req, res) => {
  try {
    const { name, start_date, end_date, description, cover_photo } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Name, start date and end date are required",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO trips
      (user_id, name, start_date, end_date, description, cover_photo)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name,
        start_date,
        end_date,
        description || null,
        cover_photo || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      tripId: result.insertId,
    });
  } catch (error) {
    console.error("Create trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create trip",
    });
  }
};


// Get all trips of logged-in user
const getTrips = async (req, res) => {
  try {
    const [trips] = await pool.query(
      `SELECT id, name, 
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
              description, cover_photo,
              created_at, updated_at
       FROM trips
       WHERE user_id = ?
       ORDER BY start_date ASC`,
      [req.user.id]
    );

    res.json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch trips",
    });
  }
};


// Get one trip
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const [trips] = await pool.query(
      `SELECT id, name,        
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
              description, cover_photo,
              created_at, updated_at
       FROM trips
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      trip: trips[0],
    });
  } catch (error) {
    console.error("Get trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch trip",
    });
  }
};

// Update a trip
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, description, cover_photo } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Name, start date and end date are required",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const [result] = await pool.query(
      `UPDATE trips
       SET name = ?,
           start_date = ?,
           end_date = ?,
           description = ?,
           cover_photo = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        start_date,
        end_date,
        description || null,
        cover_photo || null,
        id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      message: "Trip updated successfully",
    });
  } catch (error) {
    console.error("Update trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update trip",
    });
  }
};

// Delete a trip
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM trips
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete trip",
    });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};