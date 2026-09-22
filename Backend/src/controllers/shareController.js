const crypto = require("crypto");
const pool = require("../config/Database");

const makeTripPublic = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check trip ownership
    const [trips] = await pool.query(
      `SELECT id, is_public, share_token
       FROM trips
       WHERE id = ? AND user_id = ?`,
      [tripId, req.user.id]
    );

    if (trips.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    let shareToken = trips[0].share_token;

    // Generate token if one doesn't exist
    if (!shareToken) {
      shareToken = crypto.randomBytes(32).toString("hex");

      await pool.query(
        `UPDATE trips
         SET is_public = TRUE,
             share_token = ?
         WHERE id = ?`,
        [shareToken, tripId]
      );
    } else {
      await pool.query(
        `UPDATE trips
         SET is_public = TRUE
         WHERE id = ?`,
        [tripId]
      );
    }

    res.json({
      success: true,
      message: "Trip is now public",
      share_token: shareToken,
    });

  } catch (error) {
    console.error("Make trip public error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to make trip public",
    });
  }
};

module.exports = {
  makeTripPublic,
};