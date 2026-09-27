import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Calendar.css";
import Navbar from "../components/Navbar";

function Calendar() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/calendar/${tripId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(
            data.message || "Failed to load calendar."
          );
          return;
        }

        setTrip(data.trip);
        setCalendar(data.calendar || []);
      } catch (error) {
        console.error(error);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [tripId, navigate]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="calendar-page">
          <h1>Loading Calendar...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="calendar-page">
          <h1>Calendar</h1>
          <p>{error}</p>

          <button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="calendar-page">
        <h1>{trip.name}</h1>

        <p className="calendar-dates">
          {trip.start_date} → {trip.end_date}
        </p>

        <h2>Trip Calendar</h2>

        {calendar.length === 0 ? (
          <p>No itinerary information available.</p>
        ) : (
          calendar.map((stop) => (
            <div
              className="calendar-day"
              key={stop.id}
            >
              <div className="calendar-day-header">
                <h3>
                  {stop.city_name}
                  {stop.country
                    ? `, ${stop.country}`
                    : ""}
                </h3>

                <p>
                  {stop.start_date} →{" "}
                  {stop.end_date}
                </p>
              </div>

              {stop.activities &&
              stop.activities.length > 0 ? (
                <div className="calendar-activities">
                  {stop.activities.map(
                    (activity) => (
                      <div
                        className="calendar-activity"
                        key={activity.id}
                      >
                        <h4>{activity.name}</h4>

                        <p>
                          <strong>Time:</strong>{" "}
                          {activity.start_time ||
                            "Not specified"}
                        </p>

                        <p>
                          <strong>Duration:</strong>{" "}
                          {activity.duration_minutes ||
                            0}{" "}
                          minutes
                        </p>

                        <p>
                          <strong>Cost:</strong> ₹
                          {activity.cost || 0}
                        </p>

                        {activity.description && (
                          <p>
                            {activity.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>No activities available.</p>
              )}
            </div>
          ))
        )}

        <div className="calendar-actions">
          <button
            onClick={() =>
              navigate(`/results`, {
                state: {
                  trip: trip,
                  days: []
                }
              })
            }
          >
            Back to Trip
          </button>

          <button
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calendar;