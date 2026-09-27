import { useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import Navbar from "../components/Navbar";
import { useState } from "react";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const itinerary = location.state;

  const [sharing, setSharing] = useState(false);

  // Add City form states
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [cityStartDate, setCityStartDate] = useState("");
  const [cityEndDate, setCityEndDate] = useState("");

  if (!itinerary || !itinerary.trip) {
    return (
      <div>
        <Navbar />

        <div className="results-page">
          <h1>No Trip Information Found</h1>

          <p>Please go back and generate a trip first.</p>

          <button onClick={() => navigate("/planner")}>
            Back to Planner
          </button>
        </div>
      </div>
    );
  }

  const trip = itinerary.trip;
  const days = itinerary.days || [];

  const destination = trip.destination || trip.name;

  const description = trip.description || "";

  const budgetFromDescription =
    description.match(/Budget:\s*([^,]+)/)?.[1] || "";

  const travelStyleFromDescription =
    description.match(/Travel style:\s*([^,]+)/)?.[1] || "";

  const travelersFromDescription =
    description.match(/Travelers:\s*(\d+)/)?.[1] || "";

  const budget =
    trip.budget !== undefined
      ? trip.budget
      : budgetFromDescription;

  const travelStyle =
    trip.travel_style || travelStyleFromDescription;

  const travelers =
    trip.travelers !== undefined
      ? trip.travelers
      : travelersFromDescription;

  const handleSaveTrip = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login before saving a trip.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/trips/save",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            itinerary: itinerary
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to save trip.");
        return;
      }

      alert("Trip saved successfully!");

      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    }
  };

  const handleShareTrip = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login before sharing a trip.");
        navigate("/login");
        return;
      }

      if (!trip.id) {
        alert("Please save the trip before sharing it.");
        return;
      }

      setSharing(true);

      const response = await fetch(
        `http://localhost:5000/api/trips/${trip.id}/share`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to share trip.");
        return;
      }

      const link =
        `${window.location.origin}/public-trip/${data.share_token}`;

      await navigator.clipboard.writeText(link);

      alert("Share link copied to clipboard!");

    } catch (error) {
      console.error(error);
      alert("Unable to share trip.");

    } finally {
      setSharing(false);
    }
  };

  // Step 1 only:
  // This currently validates the Add City form.
  // Backend connection will be added in the next step.
  const handleAddCity = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login before adding a city.");
      navigate("/login");
      return;
    }

    if (!cityName || !cityStartDate || !cityEndDate) {
      alert("Please enter city name, start date and end date.");
      return;
    }

    if (cityEndDate < cityStartDate) {
      alert("End date cannot be before start date.");
      return;
    }

    if (!trip.id) {
      alert("Please save the trip before adding a city.");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/trips/${trip.id}/cities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          city_name: cityName,
          country: country,
          start_date: cityStartDate,
          end_date: cityEndDate
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Failed to add city.");
      return;
    }

    alert("City added to trip successfully!");

    // Clear form
    setCityName("");
    setCountry("");
    setCityStartDate("");
    setCityEndDate("");

  } catch (error) {
    console.error(error);
    alert("Unable to connect to the server.");
  }
};

  return (
    <div>
      <Navbar />

      <div className="results-page">

        <h1>Your Trip Plan</h1>

        {/* Trip Summary */}
        <div className="trip-summary">

          <h2>{destination}</h2>

          <p>
            <strong>Start Date:</strong>{" "}
            {trip.start_date}
          </p>

          <p>
            <strong>End Date:</strong>{" "}
            {trip.end_date}
          </p>

          <p>
            <strong>Budget:</strong>{" "}
            {budget ? `₹${budget}` : "Not available"}
          </p>

          <p>
            <strong>Travel Style:</strong>{" "}
            {travelStyle || "Not available"}
          </p>

          <p>
            <strong>Travelers:</strong>{" "}
            {travelers || "Not available"}
          </p>

        </div>

        {/* Itinerary */}
        <div className="itinerary-section">

          <h2>AI Generated Itinerary</h2>

          {days.length === 0 ? (
            <p>No itinerary days available.</p>
          ) : (
            days.map((day) => (
              <div
                className="day-card"
                key={day.day}
              >

                <h3>
                  Day {day.day} - {day.date}
                </h3>

                <p>
                  <strong>Location:</strong>{" "}
                  {day.city}, {day.country}
                </p>

                {/* Activities */}
                {day.activities &&
                day.activities.length > 0 ? (
                  <div>

                    <h4>Activities</h4>

                    {day.activities.map((activity) => (
                      <div
                        className="activity"
                        key={
                          activity.id ||
                          activity.name
                        }
                      >

                        <h4>
                          {activity.name}
                        </h4>

                        <p>
                          <strong>Type:</strong>{" "}
                          {activity.type}
                        </p>

                        <p>
                          {activity.description}
                        </p>

                        <p>
                          <strong>
                            Start Time:
                          </strong>{" "}
                          {activity.start_time}
                        </p>

                        <p>
                          <strong>
                            Duration:
                          </strong>{" "}
                          {activity.duration_minutes}{" "}
                          minutes
                        </p>

                        <p>
                          <strong>Cost:</strong>{" "}
                          ₹{activity.cost}
                        </p>

                      </div>
                    ))}

                  </div>
                ) : (
                  <p>
                    No activities available
                    for this day.
                  </p>
                )}

                {/* Daily Cost */}
                {day.estimated_cost && (
                  <div className="activity">

                    <h4>
                      Estimated Daily Cost
                    </h4>

                    <p>
                      Hotel: ₹
                      {day.estimated_cost.hotel}
                    </p>

                    <p>
                      Meals: ₹
                      {day.estimated_cost.meals}
                    </p>

                    <p>
                      Transport: ₹
                      {day.estimated_cost.transport}
                    </p>

                    <p>
                      Activities: ₹
                      {day.estimated_cost.activities}
                    </p>

                    <p>
                      <strong>
                        Total: ₹
                        {day.estimated_cost.total}
                      </strong>
                    </p>

                  </div>
                )}

              </div>
            ))
          )}

        </div>

        {/* Budget Summary */}
        {(itinerary.budget_summary ||
          itinerary.budget) && (

          <div className="trip-summary">

            <h2>Budget Summary</h2>

            {itinerary.budget_summary ? (
              <>
                <p>
                  <strong>Total:</strong>{" "}
                  ₹{itinerary.budget_summary.total}
                </p>

                <p>
                  <strong>
                    Average Per Day:
                  </strong>{" "}
                  ₹
                  {itinerary.budget_summary
                    .average_per_day}
                </p>

                <p>
                  <strong>Currency:</strong>{" "}
                  {itinerary.budget_summary.currency}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Total:</strong>{" "}
                  ₹{itinerary.budget.total}
                </p>

                <p>
                  <strong>
                    Average Per Day:
                  </strong>{" "}
                  ₹
                  {itinerary.budget.average_per_day}
                </p>

                <p>
                  <strong>Hotel:</strong>{" "}
                  ₹{itinerary.budget.hotel}
                </p>

                <p>
                  <strong>Meals:</strong>{" "}
                  ₹{itinerary.budget.meals}
                </p>

                <p>
                  <strong>Transport:</strong>{" "}
                  ₹{itinerary.budget.transport}
                </p>

                <p>
                  <strong>Activities:</strong>{" "}
                  ₹{itinerary.budget.activities}
                </p>

                <p>
                  <strong>Currency:</strong>{" "}
                  {itinerary.budget.currency}
                </p>
              </>
            )}

          </div>
        )}

        {/* Add City */}
        {trip.id && (
          <div className="add-city-section">

            <h2>Add City to Trip</h2>

            <div className="add-city-form">

              <input
                type="text"
                placeholder="City name"
                value={cityName}
                onChange={(e) =>
                  setCityName(e.target.value)
                }
              />

              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) =>
                  setCountry(e.target.value)
                }
              />

              <label>
                Start Date
              </label>

              <input
                type="date"
                value={cityStartDate}
                onChange={(e) =>
                  setCityStartDate(e.target.value)
                }
              />

              <label>
                End Date
              </label>

              <input
                type="date"
                value={cityEndDate}
                onChange={(e) =>
                  setCityEndDate(e.target.value)
                }
              />

              <button
                type="button"
                onClick={handleAddCity}
              >
                Add City
              </button>

            </div>

          </div>
        )}

        {/* Buttons */}
        <div className="results-buttons">

          {!trip.id && (
            <button onClick={handleSaveTrip}>
              Save Trip
            </button>
          )}

          {trip.id && (
            <>
              <button
                onClick={handleShareTrip}
                disabled={sharing}
              >
                {sharing
                  ? "Sharing..."
                  : "Share Trip"}
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/calendar/${trip.id}`
                  )
                }
              >
                View Calendar
              </button>
            </>
          )}

          <button
            onClick={() =>
              navigate("/planner")
            }
          >
            Plan Another Trip
          </button>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Go to Dashboard
          </button>

        </div>

      </div>
    </div>
  );
}

export default Results;
