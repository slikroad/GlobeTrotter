const pool = require("../config/Database");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // User information
    const [users] = await pool.query(
      `SELECT
        id,
        name,
        email,
        profile_photo,
        language
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Total number of trips
    const [tripCount] = await pool.query(
      `SELECT COUNT(*) AS total_trips
       FROM trips
       WHERE user_id = ?`,
      [userId]
    );

    // Upcoming trips
    const [upcomingTrips] = await pool.query(
      `SELECT
        id,
        name,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        description,
        cover_photo
       FROM trips
       WHERE user_id = ?
       AND start_date >= CURDATE()
       ORDER BY start_date ASC
       LIMIT 5`,
      [userId]
    );

    // Recent trips
    const [recentTrips] = await pool.query(
      `SELECT
        id,
        name,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        description,
        cover_photo
       FROM trips
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Budget summary
    const [budgetSummary] = await pool.query(
      `SELECT
        COALESCE(SUM(tb.hotel_cost), 0) AS hotel,
        COALESCE(SUM(tb.meals_cost), 0) AS meals,
        COALESCE(SUM(tb.transport_cost), 0) AS transport
       FROM trip_budgets tb
       JOIN trips t ON tb.trip_id = t.id
       WHERE t.user_id = ?`,
      [userId]
    );

    // Activity spending
    const [activitySummary] = await pool.query(
      `SELECT
        COALESCE(SUM(a.cost), 0) AS activities
       FROM activities a
       JOIN trip_stops ts ON a.stop_id = ts.id
       JOIN trips t ON ts.trip_id = t.id
       WHERE t.user_id = ?`,
      [userId]
    );

    const hotel = Number(budgetSummary[0].hotel);
    const meals = Number(budgetSummary[0].meals);
    const transport = Number(budgetSummary[0].transport);
    const activities = Number(activitySummary[0].activities);

    const totalBudget =
      hotel +
      meals +
      transport +
      activities;

    res.json({
      success: true,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_photo: user.profile_photo,
        language: user.language,
      },

      summary: {
        total_trips: Number(tripCount[0].total_trips),
        upcoming_trips: upcomingTrips.length,
        total_budget: totalBudget,
        currency: "INR",
      },

      upcoming_trips: upcomingTrips,

      recent_trips: recentTrips,

      budget: {
        hotel,
        meals,
        transport,
        activities,
        total: totalBudget,
        currency: "INR",
      },
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

module.exports = {
  getDashboard,
};