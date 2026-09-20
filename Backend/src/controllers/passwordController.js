const crypto = require("crypto");
const pool = require("../config/Database");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const [users] = await pool.query(
      `SELECT id
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const userId = users[0].id;

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Token valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Remove old tokens for this user
    await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE user_id = ?`,
      [userId]
    );

    // Save new token
    await pool.query(
      `INSERT INTO password_reset_tokens
       (user_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [userId, token, expiresAt]
    );

    res.json({
      success: true,
      message: "Password reset token generated",
      reset_token: token
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate password reset token",
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const {
      token,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, new password and confirm password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const [tokens] = await pool.query(
      `SELECT
        id,
        user_id,
        expires_at
       FROM password_reset_tokens
       WHERE token = ?`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const resetToken = tokens[0];

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    const bcrypt = require("bcrypt");

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await pool.query(
      `UPDATE users
       SET password = ?
       WHERE id = ?`,
      [
        hashedPassword,
        resetToken.user_id,
      ]
    );

    // Delete token so it cannot be reused
    await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE id = ?`,
      [resetToken.id]
    );

    res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};


module.exports = {
  forgotPassword,
  resetPassword,
};