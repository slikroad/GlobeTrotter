const pool = require("../config/Database");

const getActivities = async (req, res) => {
  try {
    const [activities] = await pool.query(
      `SELECT
        ac.id,
        ac.name,
        ac.type,
        ac.description,
        ac.duration_minutes,
        ac.cost,
        ac.image_url,
        ac.popularity,
        c.id AS city_id,
        c.name AS city_name,
        c.country
       FROM activity_catalog ac
       JOIN cities c ON ac.city_id = c.id
       ORDER BY ac.popularity DESC, ac.name ASC`
    );

    res.json({
      success: true,
      count: activities.length,
      activities,
    });

  } catch (error) {
    console.error("Get activity catalog error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};

const searchActivities = async (req, res) => {
  try {
    const {
      query,
      cityId,
      type,
      minCost,
      maxCost,
      maxDuration,
      minPopularity,
    } = req.query;

    let sql = `
      SELECT
        ac.id,
        ac.name,
        ac.type,
        ac.description,
        ac.duration_minutes,
        ac.cost,
        ac.image_url,
        ac.popularity,
        c.id AS city_id,
        c.name AS city_name,
        c.country
      FROM activity_catalog ac
      JOIN cities c ON ac.city_id = c.id
      WHERE 1 = 1
    `;

    const params = [];

    if (query) {
      sql += `
        AND (
          ac.name LIKE ?
          OR ac.description LIKE ?
        )
      `;

      params.push(`%${query}%`, `%${query}%`);
    }

    if (cityId) {
      sql += ` AND ac.city_id = ?`;
      params.push(Number(cityId));
    }

    if (type) {
      sql += ` AND ac.type = ?`;
      params.push(type);
    }

    if (minCost) {
      sql += ` AND ac.cost >= ?`;
      params.push(Number(minCost));
    }

    if (maxCost) {
      sql += ` AND ac.cost <= ?`;
      params.push(Number(maxCost));
    }

    if (maxDuration) {
      sql += ` AND ac.duration_minutes <= ?`;
      params.push(Number(maxDuration));
    }

    if (minPopularity) {
      sql += ` AND ac.popularity >= ?`;
      params.push(Number(minPopularity));
    }

    sql += `
      ORDER BY ac.popularity DESC, ac.name ASC
    `;

    const [activities] = await pool.query(sql, params);

    res.json({
      success: true,
      count: activities.length,
      filters: {
        query: query || null,
        cityId: cityId || null,
        type: type || null,
        minCost: minCost || null,
        maxCost: maxCost || null,
        maxDuration: maxDuration || null,
        minPopularity: minPopularity || null,
      },
      activities,
    });

  } catch (error) {
    console.error("Search activities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search activities",
    });
  }
};

const addCatalogActivityToTrip = async (req, res) => {
  try {
    const { stopId } = req.params;
    const { activityId } = req.body;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        message: "Activity ID is required",
      });
    }

    // 1. Verify that the stop belongs to the logged-in user
    const [stops] = await pool.query(
      `SELECT
        ts.id,
        ts.trip_id
       FROM trip_stops ts
       JOIN trips t ON ts.trip_id = t.id
       WHERE ts.id = ?
       AND t.user_id = ?`,
      [stopId, req.user.id]
    );

    if (stops.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip stop not found",
      });
    }

    // 2. Get the catalog activity
    const [catalogActivities] = await pool.query(
      `SELECT
        id,
        name,
        type,
        description,
        duration_minutes,
        cost
       FROM activity_catalog
       WHERE id = ?`,
      [activityId]
    );

    if (catalogActivities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Catalog activity not found",
      });
    }

    const activity = catalogActivities[0];

    // 3. Find the next activity order
    const [orderResult] = await pool.query(
      `SELECT
        COALESCE(MAX(activity_order), 0) + 1 AS next_order
       FROM activities
       WHERE stop_id = ?`,
      [stopId]
    );

    const nextOrder = orderResult[0].next_order;

    // 4. Add activity to the user's trip
    const [result] = await pool.query(
      `INSERT INTO activities
      (
        stop_id,
        name,
        type,
        description,
        duration_minutes,
        cost,
        activity_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stopId,
        activity.name,
        activity.type,
        activity.description,
        activity.duration_minutes,
        activity.cost,
        nextOrder,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Activity added to trip successfully",
      activityId: result.insertId,
    });

  } catch (error) {
    console.error("Add catalog activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add activity to trip",
    });
  }
};


module.exports = {
  getActivities,
  searchActivities,
  addCatalogActivityToTrip,
};