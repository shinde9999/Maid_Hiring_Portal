import React from 'react';
import "./MaidCard.css";
import API from '../services/api';

function MaidCard({ maid, onBookClick }) {
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const showBookBtn = currentUser.role === 'user';

  // Split comma separated skills into array
  const skillsArray = maid.skills ? maid.skills.split(',').filter(Boolean) : [];
  const timingsArray = maid.timings ? maid.timings.split(',').filter(Boolean) : [];

  // normalize photo URL: if backend stored a relative path e.g. /uploads/..., prepend API base URL
  let imgSrc = maid.photo_url || maid.photoUrl || maid.avatar || maid.photo || '';
  if (imgSrc && imgSrc.startsWith('/')) {
    try{
      const apiBase = API.defaults.baseURL.replace(/\/api\/?$/, '');
      imgSrc = apiBase + imgSrc;
    }catch(e){/* fallback to imgSrc as-is */}
  }

  return (
    <div className="maid-card">
      <div className="card-header">
        {/* show image when available, support multiple field names returned by backend */}
        {imgSrc ? (
          <div className="avatar-img-wrap">
            <img className="avatar-img" src={imgSrc} alt={maid.name} />
          </div>
        ) : (
          <div className="avatar-placeholder">👤</div>
        )}
        <div className="maid-meta">
          <h3>{maid.name}</h3>
          <span className="maid-experience">{maid.experience ? `${maid.experience} Yrs Experience` : 'New Member'}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Expected Salary</span>
            <span className="info-value">₹{maid.salary ? Number(maid.salary).toLocaleString('en-IN') : 'N/A'}/mo</span>
          </div>
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{maid.address || 'N/A'}</span>
          </div>
        </div>

        {skillsArray.length > 0 && (
          <div className="details-section">
            <h4>Skills</h4>
            <div className="skills-badge-list">
              {skillsArray.map((skill, index) => (
                <span key={index} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {timingsArray.length > 0 && (
          <div className="details-section">
            <h4>Available Hours</h4>
            <div className="timings-badge-list">
              {timingsArray.map((timing, index) => (
                <span key={index} className="timing-badge">{timing}</span>
              ))}
            </div>
          </div>
        )}

        {maid.contact && (
          <div className="contact-info">
            <span className="phone-icon">📞</span> {maid.contact}
          </div>
        )}
      </div>

      {showBookBtn && (
        <div className="card-footer">
          <button className="book-now-btn" onClick={() => onBookClick(maid)}>
            Book Now
          </button>
        </div>
      )}
    </div>
  );
}

export default MaidCard;