import { useEffect, useState } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import './EditProfile.css';

function UserProfile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    contact: "",
    address: "",
    photo_url: "",
    role: "user",
    languages: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const languageOptions = [
    "Hindi",
    "English",
    "Marathi",
    "Bengali",
    "Telugu",
    "Tamil",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Punjabi",
    "Urdu"
  ];

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/auth/profile');
      const data = res.data;
      setUser({
        name: data.name || "",
        email: data.email || "",
        contact: data.contact || "",
        address: data.address || "",
        photo_url: data.photo_url || "",
        role: data.role || "user",
        languages: data.languages ? data.languages.split(',').filter(Boolean) : []
      });
      if (data.photo_url) setPhotoPreview(data.photo_url);
    } catch (e) {
      console.error(e);
      showToast("Error loading profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user.name || !user.contact || !user.address) {
      showToast("Please fill in Name, Contact, and Address", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: user.name,
        contact: user.contact,
        address: user.address,
        photo_url: user.photo_url,
        languages: (user.languages || []).join(',')
      };
      const res = await API.put('/auth/profile', payload);
      const data = res.data;
      setUser({
        ...data,
        languages: data.languages ? data.languages.split(',').filter(Boolean) : []
      });
      showToast("Profile saved successfully!", "success");

      // Update local storage so navbar reflects changes immediately
      const existing = JSON.parse(localStorage.getItem('user')) || {};
      const merged = { ...existing, ...data };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data || err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await API.post('/auth/profile/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = res.data.photo_url;
      setPhotoPreview(photoUrl);
      setUser(prev => ({ ...prev, photo_url: photoUrl }));
      showToast("Profile photo uploaded successfully!", "success");

      // Update local storage + navbar
      const existing = JSON.parse(localStorage.getItem('user')) || {};
      const merged = { ...existing, photo_url: photoUrl };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('userUpdated'));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data || err.message || "Upload failed", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleLanguage = (lang) => {
    const current = user.languages || [];
    if (current.includes(lang)) {
      setUser({ ...user, languages: current.filter(l => l !== lang) });
    } else {
      setUser({ ...user, languages: [...current, lang] });
    }
  };

  const calculateStrength = () => {
    let score = 0;
    if (user.name) score += 20;
    if (user.contact) score += 20;
    if (user.address) score += 20;
    if (user.photo_url || photoPreview) score += 20;
    if (user.languages && user.languages.length > 0) score += 20;
    return score;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
          <div className="spinner-icon" style={{ margin: '0 auto 16px auto', width: 40, height: 40 }}></div>
          <h2 style={{ color: 'var(--text-muted)' }}>Loading Profile...</h2>
        </div>
      </div>
    );
  }

  // Normalize image preview URL
  let imgSrc = photoPreview || '';
  if (imgSrc && imgSrc.startsWith('/')) {
    try {
      const apiBase = API.defaults.baseURL.replace(/\/api\/?$/, '');
      imgSrc = apiBase + imgSrc;
    } catch (e) {}
  }

  const profileStrength = calculateStrength();
  let strengthClass = "low";
  if (profileStrength >= 80) strengthClass = "high";
  else if (profileStrength >= 40) strengthClass = "medium";

  return (
    <div>
      <Navbar />
      <div className="profile-container">

        {/* Left Form Column */}
        <div className="profile-card-form">
          <div className="profile-title-block">
            <h2>👤 Edit Client Profile</h2>
            <p>Update your personal info, contact, and address to get matching service providers</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-section-header">📌 Profile Details</div>

            <div className="form-grid-2">
              <div className="interactive-form-group form-group-full">
                <label htmlFor="fullName">Full Name</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    id="fullName"
                    className="interactive-input"
                    value={user.name || ''}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="interactive-form-group form-group-full">
                <label htmlFor="email">Email Address (Read Only)</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    id="email"
                    className="interactive-input"
                    value={user.email || ''}
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed', color: 'var(--text-light)' }}
                  />
                </div>
              </div>

              <div className="interactive-form-group form-group-full">
                <label htmlFor="contact">Contact Number</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">📞</span>
                  <input
                    id="contact"
                    className="interactive-input"
                    value={user.contact || ''}
                    onChange={(e) => setUser({ ...user, contact: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="interactive-form-group form-group-full">
                <label htmlFor="address">Service / Billing Address</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">🏠</span>
                  <input
                    id="address"
                    className="interactive-input"
                    value={user.address || ''}
                    onChange={(e) => setUser({ ...user, address: e.target.value })}
                    placeholder="e.g. 102 Green Meadows, Bandra West, Mumbai"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section-header">🗣️ Languages You Prefer</div>
            <div className="interactive-form-group">
              <label>Select languages for easy communication</label>
              <div className="pill-cloud">
                {languageOptions.map(l => {
                  const isActive = (user.languages || []).includes(l);
                  return (
                    <div
                      key={l}
                      className={`pill-option ${isActive ? 'active' : ''}`}
                      onClick={() => toggleLanguage(l)}
                    >
                      <span className="pill-checkbox-indicator">
                        {isActive ? '✓' : ''}
                      </span>
                      {l}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="profile-actions-bar">
              <button type="submit" className="submit-btn-premium" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-icon" style={{ width: 18, height: 18, borderTopColor: '#fff' }}></span>
                    Saving Profile...
                  </>
                ) : (
                  <>💾 Save Profile</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column */}
        <div className="preview-sticky-wrap">

          {/* Profile Strength */}
          <div className="strength-card">
            <div className="strength-header">
              <span className="strength-title">Profile Completeness</span>
              <span className="strength-percent">{profileStrength}%</span>
            </div>
            <div className="strength-bar-bg">
              <div
                className={`strength-bar-fill ${strengthClass}`}
                style={{ width: `${profileStrength}%` }}
              ></div>
            </div>
          </div>

          {/* Photo Card */}
          <div className="photo-uploader-card">
            <div
              className="avatar-upload-frame"
              onClick={() => document.getElementById('user-photo').click()}
            >
              {imgSrc ? (
                <img src={imgSrc} alt="avatar preview" className="avatar-preview-img" />
              ) : (
                <div className="avatar-placeholder-txt">👤</div>
              )}

              <div className="avatar-upload-overlay">
                <span className="overlay-camera-icon">📷</span>
                <span className="overlay-camera-txt">Upload Photo</span>
              </div>

              {uploadingPhoto && (
                <div className="avatar-upload-spinner">
                  <div className="spinner-icon"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            <input
              id="user-photo"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhoto}
            />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>Profile Photo</h4>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: 4 }}>
              Add a face photo to help service providers recognize you during bookings.
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="preview-heading-row">
            <span className="preview-pulse-dot"></span>
            <span>Live Member Card Preview</span>
          </div>

          <div className="user-live-preview-card" style={{ borderTop: '4px solid var(--secondary)' }}>
            <div className="user-preview-header" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', padding: '20px' }}>
              <div className="user-preview-avatar" style={{ width: 64, height: 64 }}>
                {imgSrc ? (
                  <img src={imgSrc} alt="preview" className="user-preview-avatar-img" />
                ) : (
                  <span style={{ fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <div className="user-preview-meta">
                <h4 style={{ color: '#fff', fontSize: '1.15rem' }}>{user.name || 'Member Name'}</h4>
                <span className="user-preview-role" style={{ textTransform: 'uppercase' }}>
                  🔑 CLIENT
                </span>
              </div>
            </div>

            <div className="user-preview-body" style={{ padding: '20px' }}>
              <div className="preview-info-row">
                <strong>Email Address</strong>
                <span>{user.email || 'Not verified'}</span>
              </div>

              <div className="preview-info-row">
                <strong>Billing/Service Address</strong>
                <span>{user.address || 'Not specified'}</span>
              </div>

              {user.languages && user.languages.length > 0 && (
                <div className="preview-info-row">
                  <strong>Languages Preferred</strong>
                  <div className="preview-badge-cloud">
                    {user.languages.map(l => (
                      <span key={l} className="preview-badge secondary-badge">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {user.contact && (
                <div className="preview-info-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '16px', marginBottom: 0 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    📞 {user.contact}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modern custom toast alerts */}
      {toast.show && (
        <div className="toast-container-custom">
          <div className={`toast-card-custom ${toast.type}`}>
            <span className="toast-icon-custom">
              {toast.type === 'success' ? '✨' : '⚠️'}
            </span>
            <div className="toast-content-custom">
              <h5>{toast.type === 'success' ? 'Profile Updated' : 'System Notice'}</h5>
              <p>{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;