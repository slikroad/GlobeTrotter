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
  // 5. Budget configuration
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
  // 6. Build activity pools
  // -----------------------------

  // Exact travel-style activities
  const styleActivities =
    catalogActivities.filter(
      (activity) =>
        activity.type?.toLowerCase() ===
        selectedStyle
    );

  // Other useful activities
  const otherActivities =
    catalogActivities.filter(
      (activity) =>
        activity.type?.toLowerCase() !==
        selectedStyle
    );

  // -----------------------------
  // 7. Apply budget preference
  // -----------------------------

  // Activities that fit selected budget
  const affordableActivities =
    catalogActivities.filter(
      (activity) =>
        Number(activity.cost || 0) <=
        budgetSettings.maxActivityCost
    );

  // -----------------------------
  // 8. Create prioritized pool
  // -----------------------------
  let activityPool = [];

  /*
    Priority:

    1. Matching travel style + budget
    2. Matching travel style
    3. Other affordable activities
    4. Other activities if absolutely necessary
  */

  const styleAndBudget =
    styleActivities.filter(
      (activity) =>
        Number(activity.cost || 0) <=
        budgetSettings.maxActivityCost
    );

  activityPool.push(...styleAndBudget);

  const styleOnly =
    styleActivities.filter(
      (activity) =>
        !activityPool.some(
          (selected) =>
            selected.id === activity.id
        )
    );

  /*
    For budget trips, we don't want expensive
    activities unless there are no alternatives.
  */

  if (
    selectedBudget === "budget" &&
    styleOnly.length > 0
  ) {
    const cheapStyleActivities =
      styleOnly.filter(
        (activity) =>
          Number(activity.cost || 0) <=
          budgetSettings.maxActivityCost
      );

    activityPool.push(
      ...cheapStyleActivities
    );
  }

  // Add other affordable activities
  const affordableOthers =
    otherActivities.filter(
      (activity) =>
        Number(activity.cost || 0) <=
        budgetSettings.maxActivityCost &&
        !activityPool.some(
          (selected) =>
            selected.id === activity.id
        )
    );

  activityPool.push(
    ...affordableOthers
  );

  // -----------------------------
  // 9. Budget-specific sorting
  // -----------------------------

  if (selectedBudget === "budget") {

    // Cheapest activities first
    activityPool.sort(
      (a, b) =>
        Number(a.cost || 0) -
        Number(b.cost || 0)
    );

  } else if (
    selectedBudget === "moderate"
  ) {

    /*
      Moderate:
      Prefer reasonably priced activities,
      but still allow some expensive ones.
    */

    activityPool.sort(
      (a, b) => {

        const costA =
          Number(a.cost || 0);

        const costB =
          Number(b.cost || 0);

        const target = 750;

        return (
          Math.abs(costA - target) -
          Math.abs(costB - target)
        );
      }
    );

  } else if (
    selectedBudget === "luxury"
  ) {

    // Premium activities first
    activityPool.sort(
      (a, b) =>
        Number(b.cost || 0) -
        Number(a.cost || 0)
    );
  }

  // -----------------------------
  // 10. If pool is empty,
  // use all city activities
  // -----------------------------
  if (activityPool.length === 0) {
    activityPool =
      [...catalogActivities];
  }

  // -----------------------------
  // 11. Generate days
  // -----------------------------
  const days = [];
  let totalCost = 0;

  /*
    Keep track of activities already used.

    This prevents:
    Day 1 → Activity A
    Day 1 → Activity A

    and also tries to prevent:

    Day 1 → Activity A
    Day 2 → Activity A
  */
  const usedActivityIds =
    new Set();

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

    // -----------------------------
    // 12. Find unused activities
    // -----------------------------
    let availableActivities =
      activityPool.filter(
        (activity) =>
          !usedActivityIds.has(
            activity.id
          )
      );

    /*
      If all activities have already
      been used, allow reuse.

      This is only necessary when the
      trip is longer than the activity
      catalog.
    */
    if (
      availableActivities.length === 0
    ) {

      availableActivities =
        [...activityPool];

      usedActivityIds.clear();
    }

    // -----------------------------
    // 13. Select activities for day
    // -----------------------------

    /*
      Maximum 2 activities per day.
    */

    const activitiesPerDay =
      Math.min(
        2,
        availableActivities.length
      );

    const selectedActivities =
      availableActivities.slice(
        0,
        activitiesPerDay
      );

    // Mark them as used
    selectedActivities.forEach(
      (activity) => {
        usedActivityIds.add(
          activity.id
        );
      }
    );

    // -----------------------------
    // 14. Format activities
    // -----------------------------
    const dayActivities =
      selectedActivities.map(
        (activity, index) => {

          const baseCost =
            Number(activity.cost || 0);

          const activityCost =
            baseCost *
            travelerCount;

          return {
            id:
              `${i + 1}-${index + 1}`,

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
    // 15. Calculate daily costs
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
    // 16. Add day
    // -----------------------------
    days.push({

      day:
        i + 1,

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
  // 17. Return itinerary
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
