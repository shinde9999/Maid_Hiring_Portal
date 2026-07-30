import { useState } from 'react';
import '../styles/manager.css';

function MaidAbout(){
  const [open, setOpen] = useState(false);
  return (
    <div className="manager-container">
      <div className="manager-header">
        <h2>About MaidPortal</h2>
        <div className="manager-actions">
          <button className="btn-secondary" onClick={()=>setOpen(!open)}>{open? 'Hide' : 'More'}</button>
        </div>
      </div>

      <div className="about-card">
        <p>MaidPortal helps connect households with reliable help. Maids can manage skills, availability, and accept bookings. Users can search, book and rate maids.</p>
        <p>Version 1.0 • Contact support@example.com</p>
      </div>

      {open && (
        <div style={{marginTop:12}}>
          <h4>Tips for success</h4>
          <ul>
            <li>Keep skills concise and honest.</li>
            <li>Set realistic availability timings.</li>
            <li>Respond to requests promptly.</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default MaidAbout;
