import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import API from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const isMaid = user?.role === 'maid';

  // update local user state when other pages update localStorage
  useEffect(() => {
    const onUpdate = () => setUser(JSON.parse(localStorage.getItem('user')));
    window.addEventListener('userUpdated', onUpdate);
    return () => window.removeEventListener('userUpdated', onUpdate);
  }, []);

  // close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".user-profile-summary-container")) {
        setShowUserDropdown(false);
      }
      if (!e.target.closest(".notifications-bell-container")) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleReadNotification = async (id, isRead) => {
    if (isRead) return;
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // normalize user photo URL if present
  let userImg = '';
  if (user) {
    userImg = user.photo_url || user.photoUrl || user.avatar || user.photo || '';
    if (userImg && userImg.startsWith('/')) {
      try {
        const apiBase = API.defaults.baseURL.replace(/\/api\/?$/, '');
        userImg = apiBase + userImg;
      } catch (e) { /* ignore */ }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserDropdown(false);
    navigate("/");
  };

  const getHomeLink = () => {
    if (!user) return "/";
    if (user.role === 'admin') return "/admin-dashboard";
    return isMaid ? "/maid-dashboard" : "/user-dashboard";
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={getHomeLink()} className="navbar-brand">
          <span className="brand-icon">✨</span>
          <span className="brand-text">MaidPortal</span>
        </Link>

        {user && (
          <div className="navbar-menu">
            <div className="navbar-links">
              {user.role === 'admin' ? (
                <>
                  <Link to="/admin-dashboard" className="nav-link">Admin Dashboard</Link>
                  <Link to="/chat" className="nav-link">Messages</Link>
                </>
              ) : !isMaid ? (
                <>
                  <Link to="/user-dashboard" className="nav-link">Explore Maids</Link>
                  <Link to="/chat" className="nav-link">Messages</Link>
                  <Link to="/user-profile" className="nav-link">My Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/maid-dashboard" className="nav-link">Profile</Link>
                  <Link to="/maid-requests" className="nav-link">Requests</Link>
                  <Link to="/maid-skills" className="nav-link">Skills Manager</Link>
                  <Link to="/chat" className="nav-link">Messages</Link>
                  <Link to="/edit-profile" className="nav-link">Edit Profile</Link>
                  <Link to="/maid-about" className="nav-link">About</Link>
                </>
              )}
            </div>

            <div className="navbar-user">
              {/* Notification Center */}
              <div className="notifications-bell-container">
                <button
                  className="bell-btn"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  title="Notifications"
                >
                  🔔
                  {notifications.filter((n) => !n.is_read).length > 0 && (
                    <span className="bell-badge">
                      {notifications.filter((n) => !n.is_read).length}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="notifications-dropdown">
                    <div className="dropdown-header">
                      <h3>Notifications</h3>
                      <button onClick={handleMarkAllRead} className="mark-all-btn">
                        Mark all as read
                      </button>
                    </div>
                    <div className="dropdown-body">
                      {notifications.length === 0 ? (
                        <p className="no-notifications">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
                            onClick={() => {
                              handleReadNotification(n.id, n.is_read);
                              setShowNotifDropdown(false);
                            }}
                          >
                            <h4 className="notif-title">{n.title}</h4>
                            <p className="notif-message">{n.message}</p>
                            <span className="notif-time">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clickable Profile Logo and Dropdown Menu */}
              <div className="user-profile-summary-container">
                <div
                  className="user-profile-summary"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  title="User Options"
                >
                  {userImg ? (
                    <div className="user-avatar"><img src={userImg} alt={user.name} className="user-avatar-img"/></div>
                  ) : (
                    <div className="user-avatar-placeholder">👤</div>
                  )}
                  <div className="user-meta">
                    <span className="user-name">{user.name}</span>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                  <span className="dropdown-caret">▼</span>
                </div>

                {showUserDropdown && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{user.name}</strong>
                      <span className="user-dropdown-email">{user.email}</span>
                    </div>
                    <hr className="user-dropdown-divider" />
                    {user.role === 'admin' && (
                      <Link to="/admin-dashboard" className="user-dropdown-item" onClick={() => setShowUserDropdown(false)}>
                        📊 Admin Dashboard
                      </Link>
                    )}
                    {user.role === 'user' && (
                      <Link to="/user-profile" className="user-dropdown-item" onClick={() => setShowUserDropdown(false)}>
                        👤 My Profile
                      </Link>
                    )}
                    {user.role === 'maid' && (
                      <Link to="/maid-dashboard" className="user-dropdown-item" onClick={() => setShowUserDropdown(false)}>
                        🧹 Maid Profile
                      </Link>
                    )}
                    <Link to="/chat" className="user-dropdown-item" onClick={() => setShowUserDropdown(false)}>
                      💬 Messages
                    </Link>
                    <hr className="user-dropdown-divider" />
                    <button onClick={handleLogout} className="user-dropdown-item logout-item">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;