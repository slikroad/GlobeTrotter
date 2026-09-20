const pool = require("../config/Database");

const getTripBudget = async (tripId, userId) => {
  // Check that the trip belongs to the logged-in user
  const [trips] = await pool.query(
    `SELECT id
     FROM trips
     WHERE id = ? AND user_id = ?`,
    [tripId, userId]
  );

  if (trips.length === 0) {
    throw new Error("Trip not found");
  }

  // Get hotel, meals and transport costs
  const [budgets] = await pool.query(
    `SELECT
        budget_type,
        hotel_cost,
        meals_cost,
        transport_cost,
        budget_limit,
        currency
     FROM trip_budgets
     WHERE trip_id = ?`,
    [tripId]
  );

  if (budgets.length === 0) {
    throw new Error("Budget information not found");
  }

  const budget = budgets[0];

  // Calculate total activity cost
  const [activityResult] = await pool.query(
    `SELECT
        COALESCE(SUM(a.cost), 0) AS activities_cost
     FROM activities a
     JOIN trip_stops ts ON a.stop_id = ts.id
     WHERE ts.trip_id = ?`,
    [tripId]
  );

  const hotel = Number(budget.hotel_cost);
  const meals = Number(budget.meals_cost);
  const transport = Number(budget.transport_cost);
  const activities = Number(activityResult[0].activities_cost);

  const total = hotel + meals + transport + activities;

  // Get number of travel days
  const [tripDates] = await pool.query(
    `SELECT
        DATEDIFF(end_date, start_date) + 1 AS number_of_days
     FROM trips
     WHERE id = ?`,
    [tripId]
  );

  const numberOfDays = tripDates[0].number_of_days;

  const averagePerDay =
    numberOfDays > 0
      ? Math.round(total / numberOfDays)
      : total;

  const budgetLimit =
    budget.budget_limit !== null
      ? Number(budget.budget_limit)
      : null;

  const remaining =
    budgetLimit !== null
      ? budgetLimit - total
      : null;

  return {
    budget_type: budget.budget_type,
    hotel,
    meals,
    transport,
    activities,
    total,
    average_per_day: averagePerDay,
    budget_limit: budgetLimit,
    remaining,
    over_budget:
      budgetLimit !== null && total > budgetLimit,
    currency: budget.currency,
  };
};

module.exports = {
  getTripBudget,
};