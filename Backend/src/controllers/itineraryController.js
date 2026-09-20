const {
  generateMockItinerary,
} = require("../services/mockItineraryService");

const pool = require("../config/Database");

const generateItinerary = async (req, res) => {
  try {
    const {
      destination,
      start_date,
      end_date,
      budget,
      travel_style,
      travelers,
    } = req.body;

    if (!destination || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message:
          "Destination, start date and end date are required",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message:
          "End date cannot be before start date",
      });
    }

    const itinerary = generateMockItinerary({
      destination,
      start_date,
      end_date,
      budget,
      travel_style,
      travelers,
    });

    res.json({
      success: true,
      message: "Mock itinerary generated successfully",
      source: "mock",
      itinerary,
    });

  } catch (error) {
    console.error(
      "Generate itinerary error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate itinerary",
    });
  }
};

const saveItinerary = async (req, res) => {



    const connection = await pool.getConnection();

  try {
    const { itinerary } = req.body;

    if (!itinerary || !itinerary.trip || !itinerary.days) {
      return res.status(400).json({
        success: false,
        message: "Valid itinerary data is required",
      });
    }

    const {
      destination,
      start_date,
      end_date,
      budget,
      travel_style,
      travelers,
    } = itinerary.trip;

    if (!destination || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message:
          "Destination, start date and end date are required",
      });
    }

    await connection.beginTransaction();

    // 1. Create the trip
    const [tripResult] = await connection.query(
      `INSERT INTO trips
      (
        user_id,
        name,
        start_date,
        end_date,
        description
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        `${destination} Trip`,
        start_date,
        end_date,
        `Budget: ${budget || "moderate"}, Travel style: ${
          travel_style || "general"
        }, Travelers: ${travelers || 1}`,
      ]
    );

    const tripId = tripResult.insertId;

    let hotelCost = 0;
    let mealsCost = 0;
    let transportCost = 0;

    // 2. Save each day as a trip stop
    for (const day of itinerary.days) {

              // Collect budget information from this day
      if (day.estimated_cost) {
        hotelCost += Number(day.estimated_cost.hotel || 0);
        mealsCost += Number(day.estimated_cost.meals || 0);
        transportCost += Number(day.estimated_cost.transport || 0);
      }

      const [stopResult] = await connection.query(
        `INSERT INTO trip_stops
        (
          trip_id,
          city_name,
          country,
          start_date,
          end_date,
          stop_order
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tripId,
          day.city,
          day.country || null,
          day.date,
          day.date,
          day.day,
        ]
      );

      const stopId = stopResult.insertId;

      // 3. Save activities for this day
      if (day.activities && day.activities.length > 0) {
        for (let i = 0; i < day.activities.length; i++) {
          const activity = day.activities[i];

          await connection.query(
            `INSERT INTO activities
            (
              stop_id,
              name,
              type,
              description,
              start_time,
              duration_minutes,
              cost,
              activity_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              stopId,
              activity.name,
              activity.type || null,
              activity.description || null,
              activity.start_time || null,
              activity.duration_minutes || null,
              activity.cost || 0,
              i + 1,
            ]
          );
        }
      }
    }
            // 4. Save trip budget
    await connection.query(
      `INSERT INTO trip_budgets
      (
        trip_id,
        budget_type,
        hotel_cost,
        meals_cost,
        transport_cost,
        currency
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tripId,
        budget || "moderate",
        hotelCost,
        mealsCost,
        transportCost,
        "INR",
      ]
    );
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Itinerary saved successfully",
      tripId,
    });

  } catch (error) {
    await connection.rollback();

    console.error("Save itinerary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save itinerary",
    });

  } finally {
    connection.release();
  }
};

module.exports = {
  generateItinerary,
  saveItinerary,
};