import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Planner.css";
import Navbar from "../components/Navbar";

function Planner() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    destination: "",
    days: "",
    budget: "",
    travelers: "",
    travelStyle: "",
    startDate: "",
    endDate: "",
    interests: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleInterestChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      setFormData({
        ...formData,
        interests: [...formData.interests, value]
      });
    } else {
      setFormData({
        ...formData,
        interests: formData.interests.filter(
          (interest) => interest !== value
        )
      });
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (Number(formData.days) <= 0) {
    alert("Number of days must be greater than 0.");
    return;
  }

  if (Number(formData.travelers) <= 0) {
    alert("Number of travelers must be greater than 0.");
    return;
  }

  if (formData.endDate < formData.startDate) {
    alert("End date cannot be before start date.");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/trips/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: formData.destination,
          start_date: formData.startDate,
          end_date: formData.endDate,
          budget: formData.budget,
          travel_style: formData.travelStyle,
          travelers: Number(formData.travelers)
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Failed to generate itinerary");
      return;
    }

    navigate("/results", {
      state: data.itinerary
    });

  } catch (error) {
    console.error(error);
    alert("Unable to connect to backend.");
  } finally {
    setLoading(false);
  }
};

const [loading, setLoading] = useState(false);

  return (
    <div>
        <Navbar />
    <div className="planner-page">
      <h1>Plan Your Trip</h1>

      <p>
        Tell us about your trip and we'll create a personalized itinerary
        for you.
      </p>

      <form onSubmit={handleSubmit}>

        {/* Destination */}
        <label>Destination</label>
        <input
          type="text"
          name="destination"
          placeholder="e.g. Goa"
          value={formData.destination}
          onChange={handleChange}
          required
        />

        {/* Number of Days */}
        <label>Number of Days</label>
        <input
          type="number"
          name="days"
          min="1"
          placeholder="e.g. 5"
          value={formData.days}
          onChange={handleChange}
          required
        />

        {/* Budget */}
        <label>Budget (₹)</label>
        <input
          type="number"
          name="budget"
          min="1"
          placeholder="e.g. 20000"
          value={formData.budget}
          onChange={handleChange}
          required
        />

        {/* Travelers */}
        <label>Number of Travelers</label>
        <input
          type="number"
          name="travelers"
          min="1"
          placeholder="e.g. 2"
          value={formData.travelers}
          onChange={handleChange}
          required
        />

        {/* Travel Style */}
        <label>Travel Style</label>
        <select
          name="travelStyle"
          value={formData.travelStyle}
          onChange={handleChange}
          required
        >
          <option value="">Select travel style</option>
          <option value="budget">Budget</option>
          <option value="moderate">Moderate</option>
          <option value="luxury">Luxury</option>
        </select>

        {/* Start Date */}
        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
        />

        {/* End Date */}
        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
        />

        {/* Interests */}
        <label>Interests</label>

        <div className="interests-container">

          <label className="interest-option">
            <input
              type="checkbox"
              value="Nature"
              onChange={handleInterestChange}
            />
            Nature
          </label>

          <label className="interest-option">
            <input
              type="checkbox"
              value="Food"
              onChange={handleInterestChange}
            />
            Food
          </label>

          <label className="interest-option">
            <input
              type="checkbox"
              value="Adventure"
              onChange={handleInterestChange}
            />
            Adventure
          </label>

          <label className="interest-option">
            <input
              type="checkbox"
              value="Culture"
              onChange={handleInterestChange}
            />
            Culture
          </label>

          <label className="interest-option">
            <input
              type="checkbox"
              value="Shopping"
              onChange={handleInterestChange}
            />
            Shopping
          </label>

        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}>
            {loading ? "Generating Your Trip..." : "Generate Trip"}
        </button>

      </form>
    </div>
    </div>
  );
}

export default Planner;