import { useNavigate } from "react-router-dom";
import "./Home.css";
import Navbar from "../components/Navbar";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
        <Navbar />
      {/* Hero Section */}
      <section className="hero">
        <h1>Plan Your Perfect Trip</h1>

        <p>
          Create personalized travel itineraries based on your
          destination, budget, and travel preferences.
        </p>

        <button onClick={() => navigate("/planner")}>
          Start Planning
        </button>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose Us?</h2>

        <div className="cards">
          <div className="card">
            <h3>Easy Planning</h3>
            <p>Create your trip in minutes.</p>
          </div>

          <div className="card">
            <h3>Budget Friendly</h3>
            <p>Plan according to your budget.</p>
          </div>

          <div className="card">
            <h3>Save Trips</h3>
            <p>Access your saved itineraries anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;