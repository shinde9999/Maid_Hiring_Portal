import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./Auth.css";
import "./MaidDashboard.css";

function MaidDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [profile, setProfile] = useState({
    age: "",
    gender: "female",
    address: "",
    experience: "",
    salary: "",
    availability: "Available",
    contact: "",
    skills: [],
    timings: []
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const skillOptions = [
    "Cooking",
    "Cleaning",
    "Baby Care",
    "Elder Care",
    "Laundry",
    "Grocery Shopping"
  ];

  const timingOptions = [
    "Morning (6am-10am)",
    "Midday (10am-2pm)",
    "Afternoon (2pm-6pm)",
    "Evening (6pm-10pm)",
    "Night (10pm-2am)"
  ];

  useEffect(() => {
    const fetchProfileAndRequests = async () => {
      try {
        // Fetch profile
        const profileRes = await API.get("/maids/profile");
        if (profileRes.data) {
          const data = profileRes.data;
          const loadedSkills = data.skills ? data.skills.split(',').filter(Boolean) : [];
          const loadedTimings = data.timings ? data.timings.split(',').filter(Boolean) : [];

          setProfile({
            age: data.age || "",
            gender: data.gender || "female",
            address: data.address || "",
            experience: data.experience || "",
            salary: data.salary || "",
            availability: data.availability || "Available",
            contact: data.contact || "",
            skills: loadedSkills,
            timings: loadedTimings
          });
          setIsEditing(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setIsEditing(false);
        } else {
          console.error("Error fetching maid profile:", err);
        }
      }

      try {
        // Fetch requests count
        const requestsRes = await API.get("/requests/maid");
        if (requestsRes.data) {
          const pending = requestsRes.data.filter((r) => r.status === "Pending").length;
          setPendingCount(pending);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndRequests();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const toggleCheckbox = (field, value) => {
    const currentList = profile[field];
    if (currentList.includes(value)) {
      setProfile({
        ...profile,
        [field]: currentList.filter((item) => item !== value)
      });
    } else {
      setProfile({
        ...profile,
        [field]: [...currentList, value]
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!profile.contact || !profile.address || !profile.salary) {
      alert("Please fill in contact, address, and expected salary");
      return;
    }

    setSaving(true);
    const payload = {
      ...profile,
      age: profile.age ? parseInt(profile.age) : null,
      experience: profile.experience ? parseInt(profile.experience) : null,
      salary: profile.salary ? parseFloat(profile.salary) : null,
      skills: profile.skills.join(','),
      timings: profile.timings.join(',')
    };

    try {
      let res;
      if (isEditing) {
        res = await API.put("/maids/profile", payload);
        alert("Profile updated successfully!");
      } else {
        res = await API.post("/maids/profile", payload);
        alert("Profile created successfully!");
        setIsEditing(true);
      }
      // update navbar avatar if backend returned photo_url
      try {
        const returned = res?.data;
        if (returned?.photo_url) {
          const existing = JSON.parse(localStorage.getItem('user')) || {};
          const merged = { ...existing, photo_url: returned.photo_url };
          localStorage.setItem('user', JSON.stringify(merged));
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert(err.response?.data || err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container" style={{ textAlign: "center", padding: "4rem" }}>
          <h2>Loading your Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Maid Dashboard</h1>
            <p>Configure your workspace profile and track client requests</p>
          </div>
          <div className="dashboard-user-greeting">
            <h3>Welcome, {user.name}!</h3>
          </div>
        </div>

        <div className="maid-dashboard-grid">
          {/* Main profile update form */}
          <div className="profile-card">
            <h3>👤 Your Professional Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="age">Age (Years)</label>
                  <input
                    id="age"
                    className="form-input"
                    type="number"
                    name="age"
                    placeholder="e.g. 28"
                    value={profile.age}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    className="form-input"
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact">Contact Number</label>
                  <input
                    id="contact"
                    className="form-input"
                    type="text"
                    name="contact"
                    placeholder="e.g. +91 9876543210"
                    value={profile.contact}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Expected Salary (₹ / Month)</label>
                  <input
                    id="salary"
                    className="form-input"
                    type="number"
                    name="salary"
                    placeholder="e.g. 12000"
                    value={profile.salary}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Experience (Years)</label>
                  <input
                    id="experience"
                    className="form-input"
                    type="number"
                    name="experience"
                    placeholder="e.g. 4"
                    value={profile.experience}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="availability">Work Status</label>
                  <select
                    id="availability"
                    className="form-input"
                    name="availability"
                    value={profile.availability}
                    onChange={handleChange}
                  >
                    <option value="Available">Available (Looking for bookings)</option>
                    <option value="Unavailable">Unavailable (Fully booked / Leave)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Service Address / Area</label>
                  <input
                    id="address"
                    className="form-input"
                    type="text"
                    name="address"
                    placeholder="e.g. Bandra West, Mumbai"
                    value={profile.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills Offered</label>
                <div className="checkbox-group-container">
                  <div className="checkbox-grid">
                    {skillOptions.map((s) => (
                      <label key={s} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={profile.skills.includes(s)}
                          onChange={() => toggleCheckbox("skills", s)}
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Available Shifts</label>
                <div className="checkbox-group-container">
                  <div className="checkbox-grid">
                    {timingOptions.map((t) => (
                      <label key={t} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={profile.timings.includes(t.split(" ")[0])}
                          onChange={() => toggleCheckbox("timings", t.split(" ")[0])}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <br />
              <button type="submit" className="save-profile-btn" disabled={saving}>
                {saving ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
              </button>
            </form>
          </div>

          {/* Sidebar Info/Metrics panel */}
          <div className="sidebar-panel">
            <div className="info-box stats-card">
              <div className="stats-num">{pendingCount}</div>
              <div className="stats-label">Pending Bookings</div>
            </div>

            <div className="info-box">
              <h3>⚡ Quick Navigation</h3>
              <div className="quick-links">
                <button
                  className="dashboard-action-btn"
                  onClick={() => navigate("/maid-requests")}
                >
                  📨 View Booking Requests
                </button>
                <button
                  className="dashboard-action-btn"
                  onClick={() => navigate("/maid-skills")}
                >
                  ⚙️ Custom Skills Manager
                </button>
              </div>
            </div>

            <div className="info-box">
              <h3>💡 Tips for Success</h3>
              <p style={{ fontSize: "0.85rem", color: "--text-muted", lineHeight: "1.6" }}>
                Keep your available timings and service area address updated. Customers search for
                helpers based on closest locations and timing slots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MaidDashboard;