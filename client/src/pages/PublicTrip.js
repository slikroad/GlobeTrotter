import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PublicTrip.css";
import Navbar from "../components/Navbar";

function PublicTrip() {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPublicTrip = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/public/trips/${shareToken}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message || "Unable to load public trip."
          );
          return;
        }

        setTrip(data.trip);
        setStops(data.stops || []);
      } catch (error) {
        console.error(error);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTrip();
  }, [shareToken]);

  const handleCopyTrip = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login to copy this trip.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/public/trips/${shareToken}/copy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to copy trip.");
        return;
      }

      alert("Trip copied successfully!");
      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server.");
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />

        <div className="public-trip-page">
          <h1>Loading Trip...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />

        <div className="public-trip-page">
          <h1>Trip Not Found</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="public-trip-page">

        <h1>{trip.name}</h1>

        <div className="trip-summary">

          <p>
            <strong>Start Date:</strong>{" "}
            {trip.start_date}
          </p>

          <p>
            <strong>End Date:</strong>{" "}
            {trip.end_date}
          </p>

          {trip.description && (
            <p>
              <strong>Details:</strong>{" "}
              {trip.description}
            </p>
          )}

          <div className="public-trip-actions">
            <button onClick={handleCopyTrip}>
              Copy This Trip
            </button>
          </div>

        </div>

        <h2>Itinerary</h2>

        {stops.length === 0 ? (
          <p>No itinerary details available.</p>
        ) : (
          stops.map((stop) => (
            <div
              className="day-card"
              key={stop.id}
            >

              <h3>
                {stop.city_name}
              </h3>

              <p>
                {stop.start_date} to{" "}
                {stop.end_date}
              </p>

              {stop.activities &&
              stop.activities.length > 0 ? (
                <div>

                  <h4>Activities</h4>

                  {stop.activities.map((activity) => (
                    <div
                      className="activity"
                      key={activity.id}
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
                        <strong>Start Time:</strong>{" "}
                        {activity.start_time}
                      </p>

                      <p>
                        <strong>Duration:</strong>{" "}
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
                <p>No activities available.</p>
              )}

            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default PublicTrip;