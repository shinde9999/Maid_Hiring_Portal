import { useEffect, useState } from 'react';
import API from '../services/api';
import "./EditProfile.css";
import Navbar from "../components/Navbar";
import "../styles/manager.css";

function EditProfile() {
  const [profile, setProfile] = useState({
    age: "",
    gender: "female",
    address: "",
    experience: "",
    salary: "",
    availability: "Available",
    contact: "",
    skills: [],
    timings: [],
    languages: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
      const res = await API.get('/maids/profile');
      if (res.data) {
        const data = res.data;
        setProfile({
          age: data.age || "",
          gender: data.gender || "female",
          address: data.address || "",
          experience: data.experience || "",
          salary: data.salary || "",
          availability: data.availability || "Available",
          contact: data.contact || "",
          skills: data.skills ? data.skills.split(',').filter(Boolean) : [],
          timings: data.timings ? data.timings.split(',').filter(Boolean) : [],
          languages: data.languages ? data.languages.split(',').filter(Boolean) : []
        });
        if (data.photo_url) setPhotoPreview(data.photo_url);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error loading profile', err);
        showToast("Error loading profile data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleGenderSelect = (genderVal) => {
    setProfile({ ...profile, gender: genderVal });
  };

  const handleStatusSelect = (statusVal) => {
    setProfile({ ...profile, availability: statusVal });
  };

  const toggleCheckbox = (field, value) => {
    const current = profile[field] || [];
    if (current.includes(value)) {
      setProfile({ ...profile, [field]: current.filter(i => i !== value) });
    } else {
      setProfile({ ...profile, [field]: [...current, value] });
    }
  };

  const calculateStrength = () => {
    let score = 0;
    if (profile.age) score += 10;
    if (profile.gender) score += 10;
    if (profile.contact) score += 15;
    if (profile.salary) score += 15;
    if (profile.experience !== "") score += 10;
    if (profile.address) score += 15;
    if (profile.skills && profile.skills.length > 0) score += 10;
    if (profile.timings && profile.timings.length > 0) score += 10;
    if (profile.languages && profile.languages.length > 0) score += 5;
    return score;
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!profile.contact || !profile.address || !profile.salary) {
      showToast("Please fill in contact, address, and expected salary", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...profile,
        age: profile.age ? parseInt(profile.age) : null,
        experience: profile.experience !== "" ? parseInt(profile.experience) : null,
        salary: profile.salary ? parseFloat(profile.salary) : null,
        skills: (profile.skills || []).join(','),
        timings: (profile.timings || []).join(','),
        languages: (profile.languages || []).join(',')
      };
      
      const res = await API.put('/maids/profile', payload);
      showToast("Profile saved successfully!", "success");
      
      // Update local storage and dispatch event
      try {
        const returned = res?.data;
        if (returned?.photo_url) {
          const existing = JSON.parse(localStorage.getItem('user')) || {};
          const merged = { ...existing, photo_url: returned.photo_url };
          localStorage.setItem('user', JSON.stringify(merged));
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }
    } catch (err) {
      console.error('Save failed', err);
      showToast(err.response?.data || err.message || 'Save failed', "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setUploadingPhoto(true);

    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await API.post('/maids/profile/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = res.data.photo_url;
      setPhotoPreview(photoUrl);
      setProfile(prev => ({ ...prev, photo_url: photoUrl }));
      showToast("Profile image uploaded successfully!", "success");

      // Update navbar user
      try {
        const existing = JSON.parse(localStorage.getItem('user')) || {};
        const merged = { ...existing, photo_url: photoUrl };
        localStorage.setItem('user', JSON.stringify(merged));
        window.dispatchEvent(new Event('userUpdated'));
      } catch (e) {
        console.warn('Could not update localStorage user', e);
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast(err.response?.data || err.message || 'Upload failed', "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
          <div className="spinner-icon" style={{ margin: '0 auto 16px auto', width: 40, height: 40 }}></div>
          <h2 style={{ color: 'var(--text-muted)' }}>Loading Professional Profile...</h2>
        </div>
      </div>
    );
  }

  // Normalize image preview
  let imgSrc = photoPreview || '';
  if (imgSrc && imgSrc.startsWith('/')) {
    try {
      const apiBase = API.defaults.baseURL.replace(/\/api\/?$/, '');
      imgSrc = apiBase + imgSrc;
    } catch (e) {}
  }

  const maidName = JSON.parse(localStorage.getItem('user'))?.name || 'Your Name';
  const profileStrength = calculateStrength();
  
  // Choose class for progress bar
  let strengthClass = "low";
  if (profileStrength >= 75) strengthClass = "high";
  else if (profileStrength >= 40) strengthClass = "medium";

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        
        {/* Left Form Panel */}
        <div className="profile-card-form">
          <div className="profile-title-block">
            <h2>🧹 Edit Professional Profile</h2>
            <p>Fill out your details to display your professional profile on our platform</p>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-section-header">📌 Basic Personal Details</div>
            
            <div className="form-grid-2">
              <div className="interactive-form-group">
                <label htmlFor="age">Age (Years)</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">🎂</span>
                  <input
                    id="age"
                    className="interactive-input"
                    type="number"
                    name="age"
                    placeholder="e.g. 28"
                    value={profile.age}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="interactive-form-group">
                <label>Gender</label>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${profile.gender === 'female' ? 'active' : ''}`}
                    onClick={() => handleGenderSelect('female')}
                  >
                    👩 Female
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${profile.gender === 'male' ? 'active' : ''}`}
                    onClick={() => handleGenderSelect('male')}
                  >
                    👨 Male
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${profile.gender === 'other' ? 'active' : ''}`}
                    onClick={() => handleGenderSelect('other')}
                  >
                    👤 Other
                  </button>
                </div>
              </div>

              <div className="interactive-form-group">
                <label htmlFor="contact">Contact Number</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">📞</span>
                  <input
                    id="contact"
                    className="interactive-input"
                    type="text"
                    name="contact"
                    placeholder="e.g. +91 98765 43210"
                    value={profile.contact}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="interactive-form-group">
                <label htmlFor="address">Service Area / City</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">📍</span>
                  <input
                    id="address"
                    className="interactive-input"
                    type="text"
                    name="address"
                    placeholder="e.g. Bandra West, Mumbai"
                    value={profile.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section-header">💼 Professional Settings</div>

            <div className="form-grid-2">
              <div className="interactive-form-group">
                <label htmlFor="salary">Expected Monthly Salary (₹)</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">₹</span>
                  <input
                    id="salary"
                    className="interactive-input"
                    type="number"
                    name="salary"
                    placeholder="e.g. 12000"
                    value={profile.salary}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="interactive-form-group">
                <label htmlFor="experience">Years of Experience</label>
                <div className="interactive-input-wrapper">
                  <span className="input-icon">⭐</span>
                  <input
                    id="experience"
                    className="interactive-input"
                    type="number"
                    name="experience"
                    placeholder="e.g. 4"
                    value={profile.experience}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="interactive-form-group form-group-full">
                <label>Job Availability Status</label>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${profile.availability === 'Available' ? 'active' : ''}`}
                    style={profile.availability === 'Available' ? { color: 'var(--success)' } : {}}
                    onClick={() => handleStatusSelect('Available')}
                  >
                    🟢 Available (Accepting bookings)
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${profile.availability === 'Unavailable' ? 'active' : ''}`}
                    style={profile.availability === 'Unavailable' ? { color: 'var(--danger)' } : {}}
                    onClick={() => handleStatusSelect('Unavailable')}
                  >
                    🔴 Unavailable (Fully booked / On Leave)
                  </button>
                </div>
              </div>
            </div>

            <div className="form-section-header">🛠️ Skills Offered</div>
            <div className="interactive-form-group">
              <label>Select Your Specializations</label>
              <div className="pill-cloud">
                {skillOptions.map(s => {
                  const isActive = (profile.skills || []).includes(s);
                  return (
                    <div
                      key={s}
                      className={`pill-option ${isActive ? 'active' : ''}`}
                      onClick={() => toggleCheckbox('skills', s)}
                    >
                      <span className="pill-checkbox-indicator">
                        {isActive ? '✓' : ''}
                      </span>
                      {s}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-section-header">⏰ Shift Availability</div>
            <div className="interactive-form-group">
              <label>Select Preferred Working Hours</label>
              <div className="pill-cloud">
                {timingOptions.map(t => {
                  const shiftName = t.split(' ')[0];
                  const isActive = (profile.timings || []).includes(shiftName);
                  return (
                    <div
                      key={t}
                      className={`pill-option ${isActive ? 'active' : ''}`}
                      onClick={() => toggleCheckbox('timings', shiftName)}
                    >
                      <span className="pill-checkbox-indicator">
                        {isActive ? '✓' : ''}
                      </span>
                      {t}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-section-header">🗣️ Languages Spoken</div>
            <div className="interactive-form-group">
              <label>Click languages you are comfortable with</label>
              <div className="pill-cloud">
                {languageOptions.map(l => {
                  const isActive = (profile.languages || []).includes(l);
                  return (
                    <div
                      key={l}
                      className={`pill-option ${isActive ? 'active' : ''}`}
                      onClick={() => toggleCheckbox('languages', l)}
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

        {/* Right Sticky Preview / Progress Panel */}
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

          {/* Photo Upload Section */}
          <div className="photo-uploader-card">
            <div
              className="avatar-upload-frame"
              onClick={() => document.getElementById('maid-photo').click()}
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
              id="maid-photo"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>Profile Photo</h4>
            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: 4 }}>
              Uploading a professional photo increases trust and helps you stand out.
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="preview-heading-row">
            <span className="preview-pulse-dot"></span>
            <span>Live Public Card Preview</span>
          </div>

          <div className="user-live-preview-card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div className="user-preview-header" style={{ padding: '20px' }}>
              <div className="user-preview-avatar" style={{ width: 64, height: 64 }}>
                {imgSrc ? (
                  <img src={imgSrc} alt="preview" className="user-preview-avatar-img" />
                ) : (
                  <span style={{ fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <div className="user-preview-meta">
                <h4 style={{ color: '#fff', fontSize: '1.15rem' }}>{maidName}</h4>
                <span className="user-preview-role" style={{ background: 'rgba(255,255,255,0.15)', textTransform: 'capitalize' }}>
                  ⭐ {profile.experience ? `${profile.experience} Yrs Exp` : 'New Member'}
                </span>
              </div>
            </div>

            <div className="user-preview-body" style={{ padding: '20px' }}>
              <div className="preview-info-row">
                <strong>Expected Salary</strong>
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                  ₹{profile.salary ? Number(profile.salary).toLocaleString('en-IN') : '0'}/mo
                </span>
              </div>

              <div className="preview-info-row">
                <strong>Service Location</strong>
                <span>{profile.address || 'Not specified'}</span>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div className="preview-info-row">
                  <strong>Skills Offered</strong>
                  <div className="preview-badge-cloud">
                    {profile.skills.map(s => (
                      <span key={s} className="preview-badge primary-badge">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.timings && profile.timings.length > 0 && (
                <div className="preview-info-row">
                  <strong>Available Shifts</strong>
                  <div className="preview-badge-cloud">
                    {profile.timings.map(t => (
                      <span key={t} className="preview-badge">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div className="preview-info-row">
                  <strong>Languages Spoken</strong>
                  <div className="preview-badge-cloud">
                    {profile.languages.map(l => (
                      <span key={l} className="preview-badge secondary-badge">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.contact && (
                <div className="preview-info-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '16px', marginBottom: 0 }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    📞 {profile.contact}
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

export default EditProfile;
