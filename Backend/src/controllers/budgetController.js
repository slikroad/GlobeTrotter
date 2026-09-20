const {
  getTripBudget,
} = require("../services/budgetService");

const getBudget = async (req, res) => {
  try {
    const { tripId } = req.params;

    const budget = await getTripBudget(
      tripId,
      req.user.id
    );

    res.json({
      success: true,
      budget,
    });

  } catch (error) {
    console.error("Get budget error:", error);

    if (error.message === "Trip not found") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (error.message === "Budget information not found") {
      return res.status(404).json({
        success: false,
        message: "Budget information not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to get trip budget",
    });
  }
};

module.exports = {
  getBudget,
};