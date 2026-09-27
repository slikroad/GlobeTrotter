import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import Navbar from "../components/Navbar";

function Profile() {
  const navigate = useNavigate();

  const savedUser = JSON.parse(
    localStorage.getItem("user")
  );

  const [profile, setProfile] = useState({
    name: savedUser?.name || "",
    email: savedUser?.email || "",
    travelStyle: "Moderate",
    interests: ["Nature", "Food"]
  });

  const [editing, setEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleInterestChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      setProfile({
        ...profile,
        interests: [...profile.interests, value]
      });
    } else {
      setProfile({
        ...profile,
        interests: profile.interests.filter(
          (interest) => interest !== value
        )
      });
    }
  };

  const handleSave = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          language: "en"
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Failed to update profile");
      return;
    }

    const updatedUser = {
      ...savedUser,
      name: profile.name,
      email: profile.email
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    alert("Profile updated successfully!");

    setEditing(false);

  } catch (error) {
    console.error(error);
    alert("Unable to connect to server.");
  }
};

  return (
    <div>
      <Navbar />

      <div className="profile-page">
        <h1>My Profile</h1>

        {!editing ? (
          <>
            <div className="profile-info">
              <h2>{profile.name}</h2>

              <p>
                <strong>Email:</strong>{" "}
                {profile.email}
              </p>

              <p>
                <strong>Travel Style:</strong>{" "}
                {profile.travelStyle}
              </p>

              <p>
                <strong>Interests:</strong>{" "}
                {profile.interests.length > 0
                  ? profile.interests.join(", ")
                  : "None selected"}
              </p>
            </div>

            <button onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </>
        ) : (
          <div className="profile-form">
            <label>Name</label>

            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
            />

            <label>Email</label>

            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
            />

            <label>Travel Style</label>

            <select
              name="travelStyle"
              value={profile.travelStyle}
              onChange={handleChange}
            >
              <option value="Budget">Budget</option>
              <option value="Moderate">Moderate</option>
              <option value="Luxury">Luxury</option>
            </select>

            <label>Interests</label>

            <div>
              <label>
                <input
                  type="checkbox"
                  value="Nature"
                  checked={profile.interests.includes(
                    "Nature"
                  )}
                  onChange={handleInterestChange}
                />
                Nature
              </label>

              <label>
                <input
                  type="checkbox"
                  value="Food"
                  checked={profile.interests.includes(
                    "Food"
                  )}
                  onChange={handleInterestChange}
                />
                Food
              </label>

              <label>
                <input
                  type="checkbox"
                  value="Adventure"
                  checked={profile.interests.includes(
                    "Adventure"
                  )}
                  onChange={handleInterestChange}
                />
                Adventure
              </label>

              <label>
                <input
                  type="checkbox"
                  value="Culture"
                  checked={profile.interests.includes(
                    "Culture"
                  )}
                  onChange={handleInterestChange}
                />
                Culture
              </label>

              <label>
                <input
                  type="checkbox"
                  value="Shopping"
                  checked={profile.interests.includes(
                    "Shopping"
                  )}
                  onChange={handleInterestChange}
                />
                Shopping
              </label>
            </div>

            <button onClick={handleSave}>
              Save Changes
            </button>

            <button onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        )}

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Profile;
