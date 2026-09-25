import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Navbar from "../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();

  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Trips
        const tripsResponse = await fetch(
          "http://localhost:5000/api/trips",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const tripsData = await tripsResponse.json();

        if (
          tripsResponse.ok &&
          tripsData.success
        ) {
          setSavedTrips(tripsData.trips || []);
        }

        // Dashboard Statistics
        const dashboardResponse = await fetch(
          "http://localhost:5000/api/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const dashboardInfo =
          await dashboardResponse.json();
          console.log("Dashboard Data:", dashboardInfo);

        if (
          dashboardResponse.ok &&
          dashboardInfo.success
        ) {
          setDashboardData(dashboardInfo);
        }

      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleViewTrip = async (tripId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/trips/${tripId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message || "Failed to load trip."
        );
        return;
      }

      navigate("/results", {
        state: {
          trip: data.trip,
          days: data.days,
          budget: data.budget
        }
      });

    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  if (loading) {
    return (
      <div>
        <Navbar />

        <div className="dashboard-page">
          <h1>Loading Dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="dashboard-page">

        <h1>My Dashboard</h1>

        {dashboardData && (
          <>
            {/* Welcome Card */}
            <div className="welcome-card">
              <h2>
                Welcome, {dashboardData.user.name}
              </h2>

              <p>
                {dashboardData.user.email}
              </p>
            </div>

            {/* Statistics */}
            <div className="stats-grid">

              <div className="stat-card">
                <h3>Total Trips</h3>
                <p>
                  {
                    dashboardData.summary
                      .total_trips
                  }
                </p>
              </div>

              <div className="stat-card">
                <h3>Upcoming Trips</h3>
                <p>
                  {
                    dashboardData.summary
                      .upcoming_trips
                  }
                </p>
              </div>

              <div className="stat-card">
                <h3>Total Budget</h3>
                <p>
                  ₹
                  {
                    dashboardData.summary
                      .total_budget
                  }
                </p>
              </div>

            </div>

            {/* Budget Breakdown */}
            <div className="budget-card">
              <h2>Budget Summary</h2>

              <p>
                Hotel: ₹
                {dashboardData.budget.hotel}
              </p>

              <p>
                Meals: ₹
                {dashboardData.budget.meals}
              </p>

              <p>
                Transport: ₹
                {
                  dashboardData.budget
                    .transport
                }
              </p>

              <p>
                Activities: ₹
                {
                  dashboardData.budget
                    .activities
                }
              </p>

              <p>
                <strong>
                  Total: ₹
                  {
                    dashboardData.budget
                      .total
                  }
                </strong>
              </p>
            </div>
          </>
        )}

        <h2>Your Trips</h2>

        {message && <p>{message}</p>}

        {savedTrips.length === 0 ? (
          <div className="empty-dashboard">
            <h2>No trips yet</h2>

            <p>
              Start planning your next
              adventure.
            </p>

            <button
              onClick={() =>
                navigate("/planner")
              }
            >
              Plan a Trip
            </button>
          </div>
        ) : (
          <div className="trip-list">
            {savedTrips.map((trip) => (
              <div
                className="trip-card"
                key={trip.id}
              >
                <h2>{trip.name}</h2>

                <p>
                  <strong>
                    Start Date:
                  </strong>{" "}
                  {trip.start_date}
                </p>

                <p>
                  <strong>
                    End Date:
                  </strong>{" "}
                  {trip.end_date}
                </p>

                <p>
                  <strong>
                    Details:
                  </strong>{" "}
                  {trip.description}
                </p>

                <button
                  onClick={() =>
                    handleViewTrip(trip.id)
                  }
                >
                  View Trip
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="dashboard-actions">

          <button
            onClick={() =>
              navigate("/profile")
            }
          >
            My Profile
          </button>

          <button
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;