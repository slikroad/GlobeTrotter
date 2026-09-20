const pool = require("../config/Database");

const generateMockItinerary = async ({
  destination,
  start_date,
  end_date,
  budget,
  travel_style,
  travelers,
}) => {
  // -----------------------------
  // 1. Calculate number of days
  // -----------------------------
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  const numberOfDays =
    Math.floor(
      (endDate - startDate) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  if (numberOfDays <= 0) {
    throw new Error("Invalid travel dates");
  }

  // -----------------------------
  // 2. Find destination
  // -----------------------------
  const [cities] = await pool.query(
    `SELECT
       id,
       name,
       country,
       description,
       cost_index,
       popularity,
       image_url
     FROM cities
     WHERE name = ?
     LIMIT 1`,
    [destination]
  );

  if (cities.length === 0) {
    throw new Error(
      "Destination not found in city database"
    );
  }

  const city = cities[0];

  // -----------------------------
  // 3. Get activities for city
  // -----------------------------
  const [catalogActivities] =
    await pool.query(
      `SELECT
         id,
         name,
         type,
         description,
         duration_minutes,
         cost,
         image_url,
         popularity
       FROM activity_catalog
       WHERE city_id = ?
       ORDER BY popularity DESC`,
      [city.id]
    );

  if (catalogActivities.length === 0) {
    throw new Error(
      "No activities found for this destination"
    );
  }

  // -----------------------------
  // 4. Normalize user selections
  // -----------------------------
  const selectedBudget =
    budget?.toLowerCase() || "moderate";

  const selectedStyle =
    travel_style?.toLowerCase() || "culture";

  const travelerCount =
    Number(travelers) || 1;

  // -----------------------------
  // 5. Budget limits
  // -----------------------------
  const budgetConfig = {
    budget: {
      maxActivityCost: 500,
      hotel: 1500,
      meal: 300,
      transport: 300,
    },

    moderate: {
      maxActivityCost: 1500,
      hotel: 3500,
      meal: 700,
      transport: 700,
    },

    luxury: {
      maxActivityCost: Infinity,
      hotel: 8000,
      meal: 1800,
      transport: 1500,
    },
  };

  const budgetSettings =
    budgetConfig[selectedBudget] ||
    budgetConfig.moderate;

  // -----------------------------
  // 6. Match activities to style
  // -----------------------------
  let matchingActivities =
    catalogActivities.filter(
      (activity) =>
        activity.type?.toLowerCase() ===
        selectedStyle
    );

  // If not enough exact matches,
  // include sightseeing/culture activities.
  if (matchingActivities.length === 0) {
    matchingActivities =
      catalogActivities.filter(
        (activity) =>
          activity.type?.toLowerCase() ===
            "sightseeing" ||
          activity.type?.toLowerCase() ===
            "culture"
      );
  }

  // If still empty, use all activities.
  if (matchingActivities.length === 0) {
    matchingActivities =
      catalogActivities;
  }

  // -----------------------------
  // 7. Apply budget filtering
  // -----------------------------
  let budgetActivities =
    matchingActivities.filter(
      (activity) =>
        Number(activity.cost || 0) <=
        budgetSettings.maxActivityCost
    );

  // Don't leave itinerary empty.
  if (budgetActivities.length === 0) {
    budgetActivities =
      matchingActivities;
  }

  // -----------------------------
  // 8. Generate days
  // -----------------------------
  const days = [];
  let totalCost = 0;

  for (
    let i = 0;
    i < numberOfDays;
    i++
  ) {
    const currentDate =
      new Date(startDate);

    currentDate.setDate(
      startDate.getDate() + i
    );

    // Select 2 activities per day
    const firstIndex =
      (i * 2) %
      budgetActivities.length;

    const selectedActivities = [];

const activitiesPerDay = Math.min(
  2,
  budgetActivities.length
);

for (let j = 0; j < activitiesPerDay; j++) {
  const activity =
    budgetActivities[
      (firstIndex + j) %
        budgetActivities.length
    ];

  // Prevent duplicate activity on the same day
  if (
    !selectedActivities.some(
      (selected) =>
        selected.id === activity.id
    )
  ) {
    selectedActivities.push(activity);
  }
}

    // -----------------------------
    // 9. Format activities
    // -----------------------------
    const dayActivities =
      selectedActivities.map(
        (activity, index) => {
          const baseCost =
            Number(activity.cost || 0);

          const activityCost =
            baseCost * travelerCount;

          return {
            id: `${i + 1}-${index + 1}`,

            catalog_id:
              activity.id,

            name:
              activity.name,

            type:
              activity.type,

            description:
              activity.description,

            image_url:
              activity.image_url,

            start_time:
              index === 0
                ? "10:00"
                : "15:00",

            duration_minutes:
              activity.duration_minutes,

            cost:
              activityCost,
          };
        }
      );

    // -----------------------------
    // 10. Calculate daily costs
    // -----------------------------
    const hotelCost =
      budgetSettings.hotel;

    const mealsCost =
      budgetSettings.meal *
      2 *
      travelerCount;

    const transportCost =
      budgetSettings.transport *
      travelerCount;

    const activityCost =
      dayActivities.reduce(
        (sum, activity) =>
          sum + activity.cost,
        0
      );

    const dayTotal =
      hotelCost +
      mealsCost +
      transportCost +
      activityCost;

    totalCost += dayTotal;

    // -----------------------------
    // 11. Add day
    // -----------------------------
    days.push({
      day: i + 1,

      date:
        currentDate
          .toISOString()
          .split("T")[0],

      city:
        city.name,

      country:
        city.country,

      activities:
        dayActivities,

      estimated_cost: {
        hotel:
          hotelCost,

        meals:
          mealsCost,

        transport:
          transportCost,

        activities:
          activityCost,

        total:
          dayTotal,
      },
    });
  }

  // -----------------------------
  // 12. Return itinerary
  // -----------------------------
  return {
    trip: {
      destination:
        city.name,

      start_date,

      end_date,

      budget:
        selectedBudget,

      travel_style:
        selectedStyle,

      travelers:
        travelerCount,
    },

    days,

    budget_summary: {
      total:
        totalCost,

      average_per_day:
        Math.round(
          totalCost /
            numberOfDays
        ),

      currency:
        "INR",
    },

    source:
      "database_mock",
  };
};

module.exports = {
  generateMockItinerary,
};