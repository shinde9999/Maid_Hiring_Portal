import { useState } from "react";
import API from "../services/api";
import "./BookingModal.css";

function BookingModal({ maid, onClose, onSubmitSuccess }) {
  const [startDate, setStartDate] = useState("");
  const [workHours, setWorkHours] = useState("4");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) {
      alert("Please select a start date");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/requests", {
        maid_id: maid.id,
        start_date: startDate,
        work_hours: workHours,
        message: message.trim() || `Booking request for ${maid.name}`
      });
      alert(`Booking request sent to ${maid.name}!`);
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating booking:", err);
      alert(err.response?.data || err.message || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Request Booking</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="maid-summary">
            <span className="maid-avatar">👤</span>
            <div>
              <h4>{maid.name}</h4>
              <p>{maid.skills || "General Housework"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                className="form-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="workHours">Hours of Work Per Day</label>
              <select
                id="workHours"
                className="form-input"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
              >
                <option value="2">2 Hours</option>
                <option value="4">4 Hours (Part-time)</option>
                <option value="6">6 Hours</option>
                <option value="8">8 Hours (Full-time)</option>
                <option value="12">12 Hours (Live-in assistance)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message / Instructions</label>
              <textarea
                id="message"
                className="form-input text-area"
                rows="3"
                placeholder="Describe specific duties, house size, or preferences..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
