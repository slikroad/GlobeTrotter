const pool = require("../config/Database");

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT
        id,
        name,
        email,
        profile_photo,
        language,
        created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: users[0],
    });

  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      profile_photo,
      language,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const [existingUsers] = await pool.query(
      `SELECT id
       FROM users
       WHERE email = ?
       AND id != ?`,
      [email, req.user.id]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    await pool.query(
      `UPDATE users
       SET
        name = ?,
        email = ?,
        profile_photo = ?,
        language = ?
       WHERE id = ?`,
      [
        name,
        email,
        profile_photo || null,
        language || "en",
        req.user.id,
      ]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("Delete account error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
};