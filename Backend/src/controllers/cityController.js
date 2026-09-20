const pool = require("../config/Database");

const getCities = async (req, res) => {
  try {
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
       ORDER BY popularity DESC, name ASC`
    );

    res.json({
      success: true,
      count: cities.length,
      cities,
    });

  } catch (error) {
    console.error("Get cities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cities",
    });
  }
};
const searchCities = async (req, res) => {
  try {
    const {
      query,
      country,
      minCost,
      maxCost,
      minPopularity,
    } = req.query;

    let sql = `
      SELECT
        id,
        name,
        country,
        description,
        cost_index,
        popularity,
        image_url
      FROM cities
      WHERE 1 = 1
    `;

    const params = [];

    // Search city name or country
    if (query) {
      sql += `
        AND (
          name LIKE ?
          OR country LIKE ?
        )
      `;

      params.push(`%${query}%`, `%${query}%`);
    }

    // Country filter
    if (country) {
      sql += ` AND country = ?`;
      params.push(country);
    }

    // Minimum cost index
    if (minCost) {
      sql += ` AND cost_index >= ?`;
      params.push(Number(minCost));
    }

    // Maximum cost index
    if (maxCost) {
      sql += ` AND cost_index <= ?`;
      params.push(Number(maxCost));
    }

    // Minimum popularity
    if (minPopularity) {
      sql += ` AND popularity >= ?`;
      params.push(Number(minPopularity));
    }

    sql += `
      ORDER BY popularity DESC, name ASC
    `;

    const [cities] = await pool.query(sql, params);

    res.json({
      success: true,
      count: cities.length,
      filters: {
        query: query || null,
        country: country || null,
        minCost: minCost || null,
        maxCost: maxCost || null,
        minPopularity: minPopularity || null,
      },
      cities,
    });

  } catch (error) {
    console.error("Search cities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search cities",
    });
  }
};

const getCityById = async (req, res) => {
  try {
    const { id } = req.params;

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
       WHERE id = ?`,
      [id]
    );

    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.json({
      success: true,
      city: cities[0],
    });

  } catch (error) {
    console.error("Get city error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch city",
    });
  }
};

module.exports = {
  getCities,
  searchCities,
  getCityById,
};