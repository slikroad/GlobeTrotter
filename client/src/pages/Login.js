import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Login failed.");
        return;
      }

      // Save login information for the frontend
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      setMessage(
        "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>

        <input
          type="password"
          name="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </p>
    </div>
  );
}

export default Login;