import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import MaidCard from "../components/MaidCard";
import BookingModal from "../components/BookingModal";
import API from "../services/api";
import "./Auth.css";
import "./UserDashboard.css";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("explore"); // "explore" or "bookings"
  const [maids, setMaids] = useState([]);
  const [filteredMaids, setFilteredMaids] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedMaid, setSelectedMaid] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [timingFilter, setTimingFilter] = useState("");

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

  const fetchMaids = async () => {
    try {
      const res = await API.get("/maids");
      setMaids(res.data);
      setFilteredMaids(res.data);
    } catch (err) {
      console.error("Error fetching maids:", err);
    }
  };

  const fetchBookings = useCallback(async () => {
    try {
      const res = await API.get("/requests/user");
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, []);

  useEffect(() => {
    fetchMaids();
    fetchBookings();
  }, [fetchBookings]);

  // Apply filters whenever filters or maids list change
  useEffect(() => {
    let result = [...maids];

    // Search query (location or name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          (m.address && m.address.toLowerCase().includes(query))
      );
    }

    // Skill filter
    if (skillFilter) {
      result = result.filter(
        (m) => m.skills && m.skills.toLowerCase().includes(skillFilter.toLowerCase())
      );
    }

    // Timing filter
    if (timingFilter) {
      result = result.filter(
        (m) => m.timings && m.timings.toLowerCase().includes(timingFilter.toLowerCase())
      );
    }

    setFilteredMaids(result);
  }, [searchQuery, skillFilter, timingFilter, maids]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;

    try {
      await API.put(`/requests/${id}`, { status: "Cancelled" });
      alert("Booking request cancelled.");
      fetchBookings();
    } catch (err) {
      alert(err.response?.data || err.message || "Failed to cancel booking");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSkillFilter("");
    setTimingFilter("");
  };

  return (
    <div>
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>User Dashboard</h1>
            <p>Explore professional help and manage your bookings</p>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            🔍 Find Maids
          </button>
          <button
            className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("bookings");
              fetchBookings();
            }}
          >
            📅 My Requested Bookings
          </button>
        </div>

        {activeTab === "explore" && (
          <div>
            {/* Search and filter panel */}
            <div className="filter-bar">
              <div className="filter-group">
                <label htmlFor="search">Search Location / Name</label>
                <input
                  id="search"
                  className="filter-input"
                  type="text"
                  placeholder="e.g. Mumbai, John"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="skill">Skill Needed</label>
                <select
                  id="skill"
                  className="filter-input"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                >
                  <option value="">Any Skill</option>
                  {skillOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="timing">Availability Timing</label>
                <select
                  id="timing"
                  className="filter-input"
                  value={timingFilter}
                  onChange={(e) => setTimingFilter(e.target.value)}
                >
                  <option value="">Any Timing</option>
                  {timingOptions.map((t) => (
                    <option key={t} value={t.split(" ")[0]}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear
              </button>
            </div>

            {/* Maids Grid list */}
            <h2>Available Helpers ({filteredMaids.length})</h2>
            <div className="maids-grid">
              {filteredMaids.length === 0 ? (
                <div className="no-maids-found">
                  No maids match your filter criteria. Try updating your search settings!
                </div>
              ) : (
                filteredMaids.map((maid) => (
                  <MaidCard
                    key={maid.id}
                    maid={maid}
                    onBookClick={(m) => setSelectedMaid(m)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            <h2>Your Bookings ({bookings.length})</h2>
            <br />
            {bookings.length === 0 ? (
              <div className="no-maids-found">
                You haven't requested any maids yet. Start searching to send your first booking!
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map((b) => (
                  <div key={b.id} className="booking-item">
                    <div className="booking-info">
                      <h4>
                        Booked: {b.maid_name}
                        <span className={`status-badge ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </h4>
                      <div className="booking-meta-row">
                        <span className="meta-field">
                          📅 <strong>Start Date:</strong> {new Date(b.start_date).toLocaleDateString()}
                        </span>
                        <span className="meta-field">
                          ⏰ <strong>Hours/Day:</strong> {b.work_hours} Hours
                        </span>
                        {b.status && b.status.toLowerCase() === "accepted" && (
                          <span className="meta-field">
                            ✅ <strong>Maid has accepted your request.</strong>
                          </span>
                        )}
                      </div>
                      <div className="booking-message">
                        <strong>Request Message:</strong> {b.message}
                      </div>
                    </div>

                    <div className="booking-actions">
                      {b.status === "Pending" && (
                        <button
                          className="cancel-booking-btn"
                          onClick={() => handleCancelBooking(b.id)}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Form overlay */}
      {selectedMaid && (
        <BookingModal
          maid={selectedMaid}
          onClose={() => setSelectedMaid(null)}
          onSubmitSuccess={fetchBookings}
        />
      )}
    </div>
  );
}

export default UserDashboard;