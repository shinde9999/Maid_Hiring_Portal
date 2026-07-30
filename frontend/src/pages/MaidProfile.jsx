import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import '../styles/interactive.css';

function MaidProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetch = useCallback(async () => {
    try {
      const res = await API.get(`/maids/profile/${id}`);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await API.get(`/maids/profile/${id}/ratings`);
      setRatings(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    fetch();
    fetchRatings();
  }, [id, fetch, fetchRatings]);

  const submitRating = async () => {
    try {
      await API.post(`/maids/profile/${id}/rating`, { rating, comment });
      alert('Rating submitted');
      fetchRatings();
    } catch (err) {
      alert(err.response?.data || err.message || 'Failed');
    }
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="card" style={{ maxWidth: 800, margin: '24px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {profile.photo_url ? (
            <div style={{ width: 88, height: 88, overflow: 'hidden', borderRadius: 8, background: '#f3f4f6' }}>
              <img
                src={profile.photo_url}
                alt={profile.maid_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 88,
                height: 88,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: '#f3f4f6',
              }}
            >
              👤
            </div>
          )}
          <div>
            <h2 style={{ margin: 0 }}>{profile.maid_name}</h2>
            <div className="muted">{profile.maid_email}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {Number(profile.rating_avg || 0).toFixed(1)}
          </div>
          <div className="muted">{profile.rating_count || 0} reviews</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <p>
            <strong>Location:</strong> {profile.address}
          </p>
          <p>
            <strong>Experience:</strong> {profile.experience}
          </p>
          <p>
            <strong>Salary:</strong> ₹{profile.salary}
          </p>
          <p>
            <strong>Skills:</strong> {profile.skills}
          </p>
          <p>
            <strong>Contact:</strong> {profile.contact}
          </p>
          <p>
            <strong>Timings:</strong> {profile.timings}
          </p>
        </div>

        <div style={{ width: 260 }}>
          <h4>Leave a review</h4>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={4}>4</option>
            <option value={3}>3</option>
            <option value={2}>2</option>
            <option value={1}>1</option>
          </select>
          <br />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave feedback"
            style={{ width: '100%', marginTop: 8 }}
          />
          <br />
          <button className="btn-primary" onClick={submitRating}>
            Submit Rating
          </button>
        </div>
      </div>

      <hr />
      <h3>Reviews</h3>
      <p>
        Average: {profile.rating_avg || 'N/A'} ({profile.rating_count || 0} reviews)
      </p>

      <div>
        {ratings.map((r) => (
          <div
            key={r.id}
            style={{
              borderTop: '1px solid #eee',
              paddingTop: 8,
              marginTop: 8,
            }}
          >
            <strong>{r.user_name}</strong> — {r.rating} / 5
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MaidProfile;