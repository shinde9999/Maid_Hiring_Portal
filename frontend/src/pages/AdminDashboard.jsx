import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "users", "maids", "requests"
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMaids: 0,
    totalClients: 0,
    totalProfiles: 0,
    totalRequests: 0,
    activeRequests: 0,
    averageRating: 0.0
  });

  // Data states
  const [users, setUsers] = useState([]);
  const [maids, setMaids] = useState([]);
  const [requests, setRequests] = useState([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Loading states
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // null for create, object for edit
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    contact: "",
    address: "",
    languages: ""
  });

  const [showMaidModal, setShowMaidModal] = useState(false);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [maidForm, setMaidForm] = useState({
    age: "",
    gender: "Female",
    address: "",
    experience: "",
    salary: "",
    availability: "Available",
    skills: "",
    contact: "",
    timings: "",
    languages: ""
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    status: "Pending",
    start_date: "",
    work_hours: "",
    message: ""
  });

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Fetch Maids
  const fetchMaids = async () => {
    try {
      const res = await API.get("/admin/maids");
      setMaids(res.data);
    } catch (err) {
      console.error("Error fetching maids:", err);
    }
  };

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      const res = await API.get("/admin/requests");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchMaids(), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- USER OPERATIONS ---
  const openCreateUserModal = () => {
    setSelectedUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "user",
      contact: "",
      address: "",
      languages: ""
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (u) => {
    setSelectedUser(u);
    setUserForm({
      name: u.name || "",
      email: u.email || "",
      password: "", // leave empty for edit
      role: u.role || "user",
      contact: u.contact || "",
      address: u.address || "",
      languages: u.languages || ""
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Edit User
        await API.put(`/admin/users/${selectedUser.id}`, userForm);
        alert("User updated successfully");
      } else {
        // Create User
        await API.post("/admin/users", userForm);
        alert("User created successfully");
      }
      setShowUserModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Failed operation");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This will delete all related records (maid profile, bookings, reviews) and cannot be undone!")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      alert("User deleted successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Deletion failed");
    }
  };

  // --- MAID PROFILE OPERATIONS ---
  const openEditMaidModal = (m) => {
    setSelectedMaid(m);
    setMaidForm({
      age: m.age || "",
      gender: m.gender || "Female",
      address: m.address || "",
      experience: m.experience || "",
      salary: m.salary || "",
      availability: m.availability || "Available",
      skills: m.skills || "",
      contact: m.contact || "",
      timings: m.timings || "",
      languages: m.languages || ""
    });
    setShowMaidModal(true);
  };

  const handleMaidSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/maids/${selectedMaid.id}`, maidForm);
      alert("Maid profile updated successfully");
      setShowMaidModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Failed operation");
    }
  };

  const handleDeleteMaidProfile = async (id) => {
    if (!window.confirm("Are you sure you want to delete this maid profile? This will delete all related bookings/ratings. The user account will remain as a client.")) return;
    try {
      await API.delete(`/admin/maids/${id}`);
      alert("Maid profile deleted successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Deletion failed");
    }
  };

  // --- BOOKING REQUEST OPERATIONS ---
  const openEditRequestModal = (r) => {
    setSelectedRequest(r);
    // Format date string to YYYY-MM-DD
    const dateFormatted = r.start_date ? new Date(r.start_date).toISOString().split("T")[0] : "";
    setRequestForm({
      status: r.status || "Pending",
      start_date: dateFormatted,
      work_hours: r.work_hours || "",
      message: r.message || ""
    });
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/requests/${selectedRequest.id}`, requestForm);
      alert("Booking request updated successfully");
      setShowRequestModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Failed operation");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await API.delete(`/admin/requests/${id}`);
      alert("Request deleted successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Deletion failed");
    }
  };

  // --- SEARCH AND FILTER LIST LOGIC ---
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const filteredMaids = maids.filter((m) => {
    const matchesSearch = m.maid_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.skills?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = availabilityFilter ? m.availability === availabilityFilter : true;
    return matchesSearch && matchesAvailability;
  });

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.maid_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page">
      <Navbar />

      <div className="admin-container">
        {/* Admin Navigation Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-menu-header">
            <h3>Admin Portal</h3>
            <p>Manage Portal Data</p>
          </div>
          <nav className="admin-nav-links">
            <button
              className={`admin-nav-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => { setActiveTab("overview"); setSearchQuery(""); }}
            >
              📊 Stats Overview
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
            >
              👥 Manage Users
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "maids" ? "active" : ""}`}
              onClick={() => { setActiveTab("maids"); setSearchQuery(""); }}
            >
              🧹 Manage Maids
            </button>
            <button
              className={`admin-nav-btn ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => { setActiveTab("requests"); setSearchQuery(""); }}
            >
              📅 Manage Bookings
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-content">
          {loading ? (
            <div className="admin-loading-spinner">Loading dashboard data...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="overview-tab-content">
                  <h2 className="content-title">Stats Overview</h2>
                  
                  <div className="stats-grid">
                    <div className="stat-card blue">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h4>Total Users</h4>
                        <p>{stats.totalUsers}</p>
                      </div>
                    </div>
                    <div className="stat-card green">
                      <div className="stat-icon">🧹</div>
                      <div className="stat-info">
                        <h4>Total Maids</h4>
                        <p>{stats.totalMaids} ({stats.totalProfiles} Profiles)</p>
                      </div>
                    </div>
                    <div className="stat-card yellow">
                      <div className="stat-icon">🤝</div>
                      <div className="stat-info">
                        <h4>Clients</h4>
                        <p>{stats.totalClients}</p>
                      </div>
                    </div>
                    <div className="stat-card purple">
                      <div className="stat-icon">📅</div>
                      <div className="stat-info">
                        <h4>Total Requests</h4>
                        <p>{stats.totalRequests}</p>
                      </div>
                    </div>
                    <div className="stat-card orange">
                      <div className="stat-icon">🔔</div>
                      <div className="stat-info">
                        <h4>Pending Bookings</h4>
                        <p>{stats.activeRequests}</p>
                      </div>
                    </div>
                    <div className="stat-card teal">
                      <div className="stat-icon">⭐</div>
                      <div className="stat-info">
                        <h4>Avg Maid Rating</h4>
                        <p>{stats.averageRating} / 5.0</p>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-row">
                    <div className="dashboard-col recent-bookings-col">
                      <h3>Recent Booking Activity</h3>
                      {requests.length === 0 ? (
                        <p className="no-activity">No bookings yet.</p>
                      ) : (
                        <div className="recent-list">
                          {requests.slice(0, 5).map((r) => (
                            <div key={r.id} className="recent-item">
                              <div className="recent-info">
                                <strong>{r.client_name}</strong> booked <strong>{r.maid_name}</strong>
                                <p>{r.message?.slice(0, 50)}...</p>
                              </div>
                              <span className={`status-badge ${r.status}`}>{r.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="dashboard-col quick-actions-col">
                      <h3>Quick Admin Actions</h3>
                      <div className="quick-actions-list">
                        <button onClick={openCreateUserModal} className="quick-action-btn">
                          ➕ Create User Account
                        </button>
                        <button onClick={() => setActiveTab("users")} className="quick-action-btn secondary">
                          👥 View All Users
                        </button>
                        <button onClick={() => setActiveTab("requests")} className="quick-action-btn secondary">
                          📅 Review Pending Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE USERS */}
              {activeTab === "users" && (
                <div className="users-tab-content">
                  <div className="content-header">
                    <h2 className="content-title">Manage User Accounts</h2>
                    <button onClick={openCreateUserModal} className="add-btn">
                      ➕ Add New User
                    </button>
                  </div>

                  <div className="filter-bar">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="admin-search-input"
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="admin-filter-select"
                    >
                      <option value="">All Roles</option>
                      <option value="user">Clients (User)</option>
                      <option value="maid">Maids (Maid)</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="empty-table-row">No users found matching query.</td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id}>
                              <td>{u.id}</td>
                              <td className="font-semibold">{u.name}</td>
                              <td>{u.email}</td>
                              <td>
                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                              </td>
                              <td>{u.contact || "N/A"}</td>
                              <td>{u.address || "N/A"}</td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={() => openEditUserModal(u)} className="edit-btn">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="delete-btn">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MANAGE MAIDS */}
              {activeTab === "maids" && (
                <div className="maids-tab-content">
                  <h2 className="content-title">Manage Maid Profiles</h2>

                  <div className="filter-bar">
                    <input
                      type="text"
                      placeholder="Search maids by name or skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="admin-search-input"
                    />
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="admin-filter-select"
                    >
                      <option value="">All Availabilities</option>
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                      <option value="Busy">Busy</option>
                    </select>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Age / Gender</th>
                          <th>Experience</th>
                          <th>Salary</th>
                          <th>Skills</th>
                          <th>Timings</th>
                          <th>Availability</th>
                          <th>Rating</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaids.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="empty-table-row">No maid profiles found.</td>
                          </tr>
                        ) : (
                          filteredMaids.map((m) => (
                            <tr key={m.id}>
                              <td>{m.id}</td>
                              <td className="font-semibold">{m.maid_name}</td>
                              <td>{m.age} yrs / {m.gender}</td>
                              <td>{m.experience} yrs</td>
                              <td>₹{m.salary}</td>
                              <td>{m.skills || "N/A"}</td>
                              <td>{m.timings || "N/A"}</td>
                              <td>
                                <span className={`avail-badge ${m.availability}`}>{m.availability}</span>
                              </td>
                              <td className="font-semibold">
                                ⭐ {Number(m.rating_avg || 0).toFixed(1)} ({m.rating_count || 0})
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={() => openEditMaidModal(m)} className="edit-btn">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteMaidProfile(m.id)} className="delete-btn">
                                    Delete Profile
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MANAGE BOOKINGS */}
              {activeTab === "requests" && (
                <div className="requests-tab-content">
                  <h2 className="content-title">Manage Bookings & Requests</h2>

                  <div className="filter-bar">
                    <input
                      type="text"
                      placeholder="Search bookings by client or maid name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="admin-search-input"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="admin-filter-select"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Client Name</th>
                          <th>Maid Name</th>
                          <th>Start Date</th>
                          <th>Hours</th>
                          <th>Message</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="empty-table-row">No booking requests found.</td>
                          </tr>
                        ) : (
                          filteredRequests.map((r) => (
                            <tr key={r.id}>
                              <td>#{r.id}</td>
                              <td className="font-semibold">{r.client_name}</td>
                              <td className="font-semibold">{r.maid_name}</td>
                              <td>{r.start_date ? new Date(r.start_date).toLocaleDateString() : "N/A"}</td>
                              <td>{r.work_hours} hrs</td>
                              <td className="message-cell" title={r.message}>{r.message || "N/A"}</td>
                              <td>
                                <span className={`status-badge ${r.status}`}>{r.status}</span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button onClick={() => openEditRequestModal(r)} className="edit-btn">
                                    Change Status
                                  </button>
                                  <button onClick={() => handleDeleteRequest(r.id)} className="delete-btn">
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. USER CREATE/EDIT MODAL */}
      {showUserModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>{selectedUser ? "Modify User Account" : "Register New User"}</h3>
              <button onClick={() => setShowUserModal(false)} className="close-modal-btn">×</button>
            </div>
            <form onSubmit={handleUserSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
              </div>

              {!selectedUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Provide a login password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>User Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="user">User (Hire Maids)</option>
                    <option value="maid">Maid (Provide Service)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={userForm.contact}
                    onChange={(e) => setUserForm({ ...userForm, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Languages</label>
                <input
                  type="text"
                  placeholder="e.g. Hindi, English, Marathi"
                  value={userForm.languages}
                  onChange={(e) => setUserForm({ ...userForm, languages: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MAID PROFILE EDIT MODAL */}
      {showMaidModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Edit Maid Profile details</h3>
              <button onClick={() => setShowMaidModal(false)} className="close-modal-btn">×</button>
            </div>
            <form onSubmit={handleMaidSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    required
                    value={maidForm.age}
                    onChange={(e) => setMaidForm({ ...maidForm, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={maidForm.gender}
                    onChange={(e) => setMaidForm({ ...maidForm, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    required
                    value={maidForm.experience}
                    onChange={(e) => setMaidForm({ ...maidForm, experience: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Salary (₹/Month)</label>
                  <input
                    type="number"
                    required
                    value={maidForm.salary}
                    onChange={(e) => setMaidForm({ ...maidForm, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Availability</label>
                  <select
                    value={maidForm.availability}
                    onChange={(e) => setMaidForm({ ...maidForm, availability: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Busy">Busy</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timings</label>
                  <input
                    type="text"
                    value={maidForm.timings}
                    placeholder="e.g. Morning (6am-10am), Midday"
                    onChange={(e) => setMaidForm({ ...maidForm, timings: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  placeholder="e.g. Cooking, Cleaning, Baby Care"
                  value={maidForm.skills}
                  onChange={(e) => setMaidForm({ ...maidForm, skills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={maidForm.contact}
                  onChange={(e) => setMaidForm({ ...maidForm, contact: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={maidForm.address}
                  onChange={(e) => setMaidForm({ ...maidForm, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Languages</label>
                <input
                  type="text"
                  value={maidForm.languages}
                  onChange={(e) => setMaidForm({ ...maidForm, languages: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowMaidModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BOOKING REQUEST STATUS EDIT MODAL */}
      {showRequestModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal small">
            <div className="modal-header">
              <h3>Change Booking Status</h3>
              <button onClick={() => setShowRequestModal(false)} className="close-modal-btn">×</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="modal-form">
              <div className="form-group">
                <label>Booking Status</label>
                <select
                  value={requestForm.status}
                  onChange={(e) => setRequestForm({ ...requestForm, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Work Hours</label>
                  <input
                    type="text"
                    required
                    value={requestForm.work_hours}
                    onChange={(e) => setRequestForm({ ...requestForm, work_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Client Message</label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
