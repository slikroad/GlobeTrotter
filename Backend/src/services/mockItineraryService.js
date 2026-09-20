const generateMockItinerary = ({
  destination,
  start_date,
  end_date,
  budget,
  travel_style,
  travelers,
}) => {
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Calculate number of days
  const numberOfDays =
    Math.floor(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    ) + 1;

  if (numberOfDays <= 0) {
    throw new Error("Invalid travel dates");
  }

  // Example cities based on destination
  const cityData = {
    Rajasthan: [
      {
        city: "Jaipur",
        country: "India",
      },
      {
        city: "Jodhpur",
        country: "India",
      },
      {
        city: "Udaipur",
        country: "India",
      },
    ],

    Goa: [
      {
        city: "Panaji",
        country: "India",
      },
      {
        city: "Calangute",
        country: "India",
      },
    ],

    Kerala: [
      {
        city: "Kochi",
        country: "India",
      },
      {
        city: "Munnar",
        country: "India",
      },
      {
        city: "Alleppey",
        country: "India",
      },
    ],
  };

  const cities = cityData[destination] || [
    {
      city: destination,
      country: "India",
    },
  ];

  // Budget configuration
  const budgetConfig = {
    budget: {
      hotel: 1500,
      meal: 300,
      activity: 200,
      transport: 300,
    },

    moderate: {
      hotel: 3500,
      meal: 700,
      activity: 600,
      transport: 700,
    },

    luxury: {
      hotel: 8000,
      meal: 1800,
      activity: 1500,
      transport: 1500,
    },
  };

  const selectedBudget =
    budgetConfig[budget?.toLowerCase()] ||
    budgetConfig.moderate;

  const activities = [
    {
      name: "Local City Tour",
      type: "Sightseeing",
      description: "Explore the main attractions of the city.",
      duration_minutes: 180,
    },
    {
      name: "Local Food Experience",
      type: "Food",
      description: "Try popular local dishes and cuisine.",
      duration_minutes: 120,
    },
    {
      name: "Cultural Experience",
      type: "Culture",
      description: "Experience the local culture and heritage.",
      duration_minutes: 150,
    },
  ];

  const days = [];

  let totalCost = 0;

  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    // Change city every few days
    const cityIndex = Math.min(
      Math.floor(i / 2),
      cities.length - 1
    );

    const city = cities[cityIndex];

    const dayActivities = activities.map(
      (activity, index) => {
        const activityCost =
          selectedBudget.activity +
          index * Math.round(selectedBudget.activity * 0.25);

        totalCost += activityCost;

        return {
          id: `${i + 1}-${index + 1}`,
          name: activity.name,
          type: activity.type,
          description: activity.description,
          start_time: `${10 + index * 3}:00`,
          duration_minutes: activity.duration_minutes,
          cost: activityCost,
        };
      }
    );

    const dayHotel = selectedBudget.hotel;
    const dayMeals = selectedBudget.meal * 2;
    const dayTransport = selectedBudget.transport;

    totalCost +=
      dayHotel +
      dayMeals +
      dayTransport;

    days.push({
      day: i + 1,
      date: currentDate.toISOString().split("T")[0],
      city: city.city,
      country: city.country,
      activities: dayActivities,
      estimated_cost: {
        hotel: dayHotel,
        meals: dayMeals,
        transport: dayTransport,
        activities: dayActivities.reduce(
          (sum, activity) => sum + activity.cost,
          0
        ),
        total:
          dayHotel +
          dayMeals +
          dayTransport +
          dayActivities.reduce(
            (sum, activity) => sum + activity.cost,
            0
          ),
      },
    });
  }

  return {
    trip: {
      destination,
      start_date,
      end_date,
      budget,
      travel_style,
      travelers: travelers || 1,
    },

    days,

    budget_summary: {
      total: totalCost,
      average_per_day: Math.round(
        totalCost / numberOfDays
      ),
      currency: "INR",
    },

    source: "mock",
  };
};

module.exports = {
  generateMockItinerary,
};