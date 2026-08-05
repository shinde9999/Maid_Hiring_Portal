import React, { useState, useEffect } from "react";
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

  // Sorting states
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Expanded row states
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedMaidId, setExpandedMaidId] = useState(null);
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  // Hover states for interactive charts
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

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

  // Sorting helper logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortData = (data, field, order) => {
    if (!field) return data;
    return [...data].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
        return order === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return order === "asc" ? -1 : 1;
      if (strA > strB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  // CSV Export utility
  const exportToCSV = (data, filename, headers) => {
    if (!data || data.length === 0) {
      alert("No data available to export");
      return;
    }

    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) {
          val = "";
        } else if (typeof val === "object") {
          val = JSON.stringify(val);
        }
        const escaped = ("" + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick inline Booking Status Change
  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      const request = requests.find(r => r.id === id);
      if (!request) return;

      const dateFormatted = request.start_date ? new Date(request.start_date).toISOString().split("T")[0] : "";
      
      await API.put(`/admin/requests/${id}`, {
        status: newStatus,
        start_date: dateFormatted,
        work_hours: request.work_hours || "8",
        message: request.message || ""
      });
      loadData();
    } catch (err) {
      alert(err.response?.data || err.message || "Failed to update status");
    }
  };

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

  const sortedUsers = sortData(filteredUsers, sortField, sortOrder);
  const sortedMaids = sortData(filteredMaids, sortField, sortOrder);
  const sortedRequests = sortData(filteredRequests, sortField, sortOrder);

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
                    <div 
                      className="stat-card blue interactive-card"
                      onClick={() => { setActiveTab("users"); setRoleFilter(""); setSearchQuery(""); }}
                      title="Click to view all users"
                    >
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h4>Total Users</h4>
                        <p>{stats.totalUsers}</p>
                      </div>
                    </div>
                    <div 
                      className="stat-card green interactive-card"
                      onClick={() => { setActiveTab("maids"); setAvailabilityFilter(""); setSearchQuery(""); }}
                      title="Click to view all maids"
                    >
                      <div className="stat-icon">🧹</div>
                      <div className="stat-info">
                        <h4>Total Maids</h4>
                        <p>{stats.totalMaids} ({stats.totalProfiles} Profiles)</p>
                      </div>
                    </div>
                    <div 
                      className="stat-card yellow interactive-card"
                      onClick={() => { setActiveTab("users"); setRoleFilter("user"); setSearchQuery(""); }}
                      title="Click to view client users"
                    >
                      <div className="stat-icon">🤝</div>
                      <div className="stat-info">
                        <h4>Clients</h4>
                        <p>{stats.totalClients}</p>
                      </div>
                    </div>
                    <div 
                      className="stat-card purple interactive-card"
                      onClick={() => { setActiveTab("requests"); setStatusFilter(""); setSearchQuery(""); }}
                      title="Click to view all bookings"
                    >
                      <div className="stat-icon">📅</div>
                      <div className="stat-info">
                        <h4>Total Requests</h4>
                        <p>{stats.totalRequests}</p>
                      </div>
                    </div>
                    <div 
                      className="stat-card orange interactive-card"
                      onClick={() => { setActiveTab("requests"); setStatusFilter("Pending"); setSearchQuery(""); }}
                      title="Click to view pending bookings"
                    >
                      <div className="stat-icon">🔔</div>
                      <div className="stat-info">
                        <h4>Pending Bookings</h4>
                        <p>{stats.activeRequests}</p>
                      </div>
                    </div>
                    <div 
                      className="stat-card teal interactive-card"
                      onClick={() => { 
                        setActiveTab("maids"); 
                        setSortField("rating_avg"); 
                        setSortOrder("desc"); 
                        setSearchQuery("");
                      }}
                      title="Click to sort maids by rating"
                    >
                      <div className="stat-icon">⭐</div>
                      <div className="stat-info">
                        <h4>Avg Maid Rating</h4>
                        <p>{stats.averageRating} / 5.0</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive SVG Charts Section */}
                  <div className="charts-container">
                    <div className="chart-card-wrapper">
                      <h3>Booking Status Distribution</h3>
                      <div className="donut-chart-flex">
                        <div className="svg-donut-wrapper" style={{ position: 'relative', width: '160px', height: '160px' }}>
                          <svg viewBox="0 0 100 100" width="100%" height="100%">
                            <circle cx="50" cy="50" r="35" fill="var(--bg-card)" />
                            {(() => {
                              const totalCount = requests.length;
                              const pending = requests.filter(r => r.status === 'Pending').length;
                              const accepted = requests.filter(r => r.status === 'Accepted').length;
                              const rejected = requests.filter(r => r.status === 'Rejected').length;
                              const cancelled = requests.filter(r => r.status === 'Cancelled').length;

                              const chartData = [
                                { name: 'Pending', count: pending, color: '#f59e0b' },
                                { name: 'Accepted', count: accepted, color: '#22c55e' },
                                { name: 'Rejected', count: rejected, color: '#ef4444' },
                                { name: 'Cancelled', count: cancelled, color: '#64748b' }
                              ].filter(s => s.count > 0);

                              const radius = 35;
                              const circumference = 2 * Math.PI * radius;
                              let accumulatedPercentage = 0;

                              return (
                                <>
                                  {chartData.map((s) => {
                                    const percentage = s.count / (totalCount || 1);
                                    const offset = accumulatedPercentage * circumference;
                                    accumulatedPercentage += percentage;
                                    return (
                                      <circle
                                        key={s.name}
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="transparent"
                                        stroke={s.color}
                                        strokeWidth={hoveredDonutSegment?.name === s.name ? "12" : "9"}
                                        strokeDasharray={`${percentage * circumference} ${circumference}`}
                                        strokeDashoffset={-offset}
                                        transform="rotate(-90 50 50)"
                                        style={{ 
                                          cursor: 'pointer', 
                                          transition: 'stroke-width 0.2s, opacity 0.2s', 
                                          opacity: hoveredDonutSegment && hoveredDonutSegment.name !== s.name ? 0.6 : 1 
                                        }}
                                        onMouseEnter={() => setHoveredDonutSegment(s)}
                                        onMouseLeave={() => setHoveredDonutSegment(null)}
                                        onClick={() => {
                                          setStatusFilter(s.name);
                                          setActiveTab("requests");
                                        }}
                                      />
                                    );
                                  })}
                                  <text x="50" y="48" textAnchor="middle" style={{ fontSize: '8px', fontWeight: '800', fill: 'var(--text-main)' }}>{totalCount}</text>
                                  <text x="50" y="55" textAnchor="middle" style={{ fontSize: '4px', fontWeight: '600', fill: 'var(--text-muted)' }}>Bookings</text>
                                </>
                              );
                            })()}
                          </svg>
                          {hoveredDonutSegment && (
                            <div className="donut-tooltip">
                              <strong>{hoveredDonutSegment.name}</strong>
                              <span>{hoveredDonutSegment.count} ({((hoveredDonutSegment.count / (requests.length || 1)) * 100).toFixed(0)}%)</span>
                            </div>
                          )}
                        </div>
                        <div className="chart-legend">
                          {(() => {
                            const pending = requests.filter(r => r.status === 'Pending').length;
                            const accepted = requests.filter(r => r.status === 'Accepted').length;
                            const rejected = requests.filter(r => r.status === 'Rejected').length;
                            const cancelled = requests.filter(r => r.status === 'Cancelled').length;

                            return [
                              { name: 'Pending', count: pending, color: '#f59e0b' },
                              { name: 'Accepted', count: accepted, color: '#22c55e' },
                              { name: 'Rejected', count: rejected, color: '#ef4444' },
                              { name: 'Cancelled', count: cancelled, color: '#64748b' }
                            ].map((s) => (
                              <div 
                                key={s.name} 
                                className="legend-item interactive"
                                onClick={() => {
                                  setStatusFilter(s.name);
                                  setActiveTab("requests");
                                }}
                                onMouseEnter={() => setHoveredDonutSegment(s)}
                                onMouseLeave={() => setHoveredDonutSegment(null)}
                                style={{
                                  backgroundColor: hoveredDonutSegment?.name === s.name ? 'rgba(79, 70, 229, 0.05)' : 'transparent'
                                }}
                              >
                                <span className="legend-color-dot" style={{ backgroundColor: s.color }} />
                                <span className="legend-label">{s.name} ({s.count})</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="chart-card-wrapper">
                      <h3>Maid Availability Status</h3>
                      <div className="bar-chart-container" style={{ position: 'relative', height: '160px' }}>
                        {(() => {
                          const available = maids.filter(m => m.availability === 'Available').length;
                          const busy = maids.filter(m => m.availability === 'Busy').length;
                          const unavailable = maids.filter(m => m.availability === 'Unavailable').length;
                          const totalMaids = maids.length;

                          const data = [
                            { name: 'Available', count: available, color: '#22c55e' },
                            { name: 'Busy', count: busy, color: '#f59e0b' },
                            { name: 'Unavailable', count: unavailable, color: '#ef4444' }
                          ];

                          const maxCount = Math.max(...data.map(d => d.count), 1);

                          return (
                            <div className="svg-bar-chart-wrapper" style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px 20px 10px' }}>
                              {data.map((b) => {
                                const heightPercent = (b.count / maxCount) * 70;
                                return (
                                  <div 
                                    key={b.name} 
                                    className="bar-column" 
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredBar(b)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    onClick={() => {
                                      setAvailabilityFilter(b.name);
                                      setActiveTab("maids");
                                    }}
                                  >
                                    <div 
                                      className="bar-rect" 
                                      style={{ 
                                        height: `${Math.max(heightPercent, 5)}%`,
                                        width: '36px', 
                                        backgroundColor: b.color, 
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'all 0.2s',
                                        opacity: hoveredBar && hoveredBar.name !== b.name ? 0.6 : 1,
                                      }}
                                    />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '6px' }}>{b.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{b.count} ({totalMaids > 0 ? ((b.count / totalMaids) * 100).toFixed(0) : 0}%)</span>
                                  </div>
                                );
                              })}

                              {hoveredBar && (
                                <div className="bar-tooltip" style={{
                                  position: 'absolute',
                                  top: '0px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  pointerEvents: 'none',
                                  zIndex: 10
                                }}>
                                  <strong>{hoveredBar.name}</strong>: {hoveredBar.count} maids
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {r.status === 'Pending' && (
                                  <div className="recent-item-actions" style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                      onClick={() => handleQuickStatusChange(r.id, "Accepted")} 
                                      className="quick-approve-btn small-btn"
                                      style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      ✔
                                    </button>
                                    <button 
                                      onClick={() => handleQuickStatusChange(r.id, "Rejected")} 
                                      className="quick-reject-btn small-btn"
                                      style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      ✖
                                    </button>
                                  </div>
                                )}
                                <span className={`status-badge ${r.status}`}>{r.status}</span>
                              </div>
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
                    <button 
                      onClick={() => exportToCSV(sortedUsers, "users_export", ["id", "name", "email", "role", "contact", "address", "languages", "created_at"])} 
                      className="export-btn"
                    >
                      📥 Export CSV
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                            ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                            Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("email")} style={{ cursor: "pointer" }}>
                            Email {sortField === "email" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("role")} style={{ cursor: "pointer" }}>
                            Role {sortField === "role" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="empty-table-row">No users found matching query.</td>
                          </tr>
                        ) : (
                          sortedUsers.map((u) => (
                            <React.Fragment key={u.id}>
                              <tr 
                                onClick={(e) => {
                                  if (e.target.tagName !== "BUTTON") {
                                    setExpandedUserId(expandedUserId === u.id ? null : u.id);
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                                className={expandedUserId === u.id ? "expanded-row" : ""}
                              >
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
                              {expandedUserId === u.id && (
                                <tr className="detail-expanded-row">
                                  <td colSpan="7">
                                    <div className="detail-row-content">
                                      <div className="detail-grid">
                                        <div><strong>Full Name:</strong> {u.name}</div>
                                        <div><strong>Email:</strong> {u.email}</div>
                                        <div><strong>Role:</strong> {u.role}</div>
                                        <div><strong>Phone:</strong> {u.contact || "None"}</div>
                                        <div><strong>Address:</strong> {u.address || "None"}</div>
                                        <div><strong>Languages:</strong> {u.languages || "None"}</div>
                                        <div><strong>Created At:</strong> {new Date(u.created_at).toLocaleString()}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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
                    <button 
                      onClick={() => exportToCSV(sortedMaids, "maids_export", ["id", "maid_name", "maid_email", "age", "gender", "experience", "salary", "availability", "skills", "timings", "languages"])} 
                      className="export-btn"
                    >
                      📥 Export CSV
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                            ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("maid_name")} style={{ cursor: "pointer" }}>
                            Name {sortField === "maid_name" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Age / Gender</th>
                          <th onClick={() => handleSort("experience")} style={{ cursor: "pointer" }}>
                            Experience {sortField === "experience" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("salary")} style={{ cursor: "pointer" }}>
                            Salary {sortField === "salary" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Skills</th>
                          <th>Timings</th>
                          <th onClick={() => handleSort("availability")} style={{ cursor: "pointer" }}>
                            Availability {sortField === "availability" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("rating_avg")} style={{ cursor: "pointer" }}>
                            Rating {sortField === "rating_avg" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMaids.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="empty-table-row">No maid profiles found.</td>
                          </tr>
                        ) : (
                          sortedMaids.map((m) => (
                            <React.Fragment key={m.id}>
                              <tr
                                onClick={(e) => {
                                  if (e.target.tagName !== "BUTTON") {
                                    setExpandedMaidId(expandedMaidId === m.id ? null : m.id);
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                                className={expandedMaidId === m.id ? "expanded-row" : ""}
                              >
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
                              {expandedMaidId === m.id && (
                                <tr className="detail-expanded-row">
                                  <td colSpan="10">
                                    <div className="detail-row-content">
                                      <div className="detail-grid">
                                        <div><strong>Maid Name:</strong> {m.maid_name}</div>
                                        <div><strong>Email:</strong> {m.maid_email}</div>
                                        <div><strong>Age / Gender:</strong> {m.age} years / {m.gender}</div>
                                        <div><strong>Experience:</strong> {m.experience} Years</div>
                                        <div><strong>Salary:</strong> ₹{m.salary} / Month</div>
                                        <div><strong>Availability:</strong> {m.availability}</div>
                                        <div><strong>Timings:</strong> {m.timings || "None"}</div>
                                        <div><strong>Contact Phone:</strong> {m.contact || "None"}</div>
                                        <div><strong>Address:</strong> {m.address || "None"}</div>
                                        <div><strong>Languages Spoken:</strong> {m.languages || "None"}</div>
                                        <div><strong>Skills:</strong> {m.skills || "None"}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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
                    <button 
                      onClick={() => exportToCSV(sortedRequests, "bookings_export", ["id", "client_name", "client_email", "maid_name", "start_date", "work_hours", "status", "message"])} 
                      className="export-btn"
                    >
                      📥 Export CSV
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                            Booking ID {sortField === "id" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("client_name")} style={{ cursor: "pointer" }}>
                            Client Name {sortField === "client_name" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("maid_name")} style={{ cursor: "pointer" }}>
                            Maid Name {sortField === "maid_name" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("start_date")} style={{ cursor: "pointer" }}>
                            Start Date {sortField === "start_date" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th onClick={() => handleSort("work_hours")} style={{ cursor: "pointer" }}>
                            Hours {sortField === "work_hours" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Message</th>
                          <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                            Status {sortField === "status" && (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRequests.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="empty-table-row">No booking requests found.</td>
                          </tr>
                        ) : (
                          sortedRequests.map((r) => (
                            <React.Fragment key={r.id}>
                              <tr
                                onClick={(e) => {
                                  if (e.target.tagName !== "BUTTON" && e.target.className !== "quick-approve-btn" && e.target.className !== "quick-reject-btn") {
                                    setExpandedRequestId(expandedRequestId === r.id ? null : r.id);
                                  }
                                }}
                                style={{ cursor: "pointer" }}
                                className={expandedRequestId === r.id ? "expanded-row" : ""}
                              >
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
                                    {r.status === "Pending" && (
                                      <>
                                        <button onClick={() => handleQuickStatusChange(r.id, "Accepted")} className="quick-approve-btn">
                                          Approve ✔
                                        </button>
                                        <button onClick={() => handleQuickStatusChange(r.id, "Rejected")} className="quick-reject-btn">
                                          Reject ✖
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => openEditRequestModal(r)} className="edit-btn">
                                      Change Status
                                    </button>
                                    <button onClick={() => handleDeleteRequest(r.id)} className="delete-btn">
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedRequestId === r.id && (
                                <tr className="detail-expanded-row">
                                  <td colSpan="8">
                                    <div className="detail-row-content">
                                      <div className="detail-grid">
                                        <div><strong>Booking ID:</strong> #{r.id}</div>
                                        <div><strong>Client Name:</strong> {r.client_name} ({r.client_email})</div>
                                        <div><strong>Maid Name:</strong> {r.maid_name} (Skills: {r.maid_skills || "None"})</div>
                                        <div><strong>Start Date:</strong> {r.start_date ? new Date(r.start_date).toLocaleString() : "N/A"}</div>
                                        <div><strong>Work Hours per Day:</strong> {r.work_hours} Hours</div>
                                        <div><strong>Booking Status:</strong> {r.status}</div>
                                        <div className="span-all-cols"><strong>Client Message:</strong> <div className="detail-message-box">{r.message || "No message provided."}</div></div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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
