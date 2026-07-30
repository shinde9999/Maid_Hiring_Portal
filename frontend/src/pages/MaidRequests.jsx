import { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/interactive.css";

function MaidRequests(){
  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);

  useEffect(()=>{
    fetchRequests();
  },[]);

  const fetchRequests = async ()=>{
    try{
      const res = await API.get('/requests/maid');
      // normalize photo URLs for each requester
      const data = res.data.map(r => {
        let photo = r.user_photo_url || r.user_photo || '';
        if(photo && photo.startsWith('/')){
          try{ photo = API.defaults.baseURL.replace(/\/api\/?$/, '') + photo; }catch(e){}
        }
        return {...r, requester_photo: photo};
      });
      setRequests(data);
    }catch(err){
      console.error(err);
      alert(err.response?.data || err.message || 'Failed to load requests');
    }
  };

  const accept = async (id) => {
    try{
      setLoadingIds((s)=>[...s,id]);
      const res = await API.post(`/requests/${id}/accept`);
      // update single request status locally for snappy UI
      setRequests((prev) => prev.map(r => r.id === id ? {...r, status: res.data.status || 'Accepted'} : r));
      fetchRequests();
    }catch(err){
      console.error(err);
      alert(err.response?.data || err.message || 'Failed to accept');
    }finally{
      setLoadingIds((s)=>s.filter(x=>x!==id));
    }
  };

  return (
    <div className="requests-container">
      <h2>Your Requests</h2>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map(r => (
        <div key={r.id} className="request-card">
          <div className="request-head">
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {r.requester_photo ? <img src={r.requester_photo} alt={r.user_name} style={{width:40,height:40,borderRadius:20,objectFit:'cover'}}/> : <div style={{width:40,height:40,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center'}}>👤</div>}
              <div>
                <div style={{fontWeight:700}}>{r.user_name}</div>
                <div className="muted">{r.user_email}</div>
              </div>
            </div>
           <span className={`status-badge ${ (r.status||'pending').toLowerCase()}`}>{r.status || 'Pending'}</span>
          </div>
          <p className="request-message">{r.message}</p>
          <div className="request-meta">
            <div>Start: {r.start_date}</div>
            <div>Hours/Day: {r.work_hours}</div>
          </div>
          <div className="request-actions">
            { (r.status?.toLowerCase() !== 'accepted') && (
              <button className="btn-primary" onClick={()=>accept(r.id)} disabled={loadingIds.includes(r.id)}>
                {loadingIds.includes(r.id) ? 'Accepting...' : 'Accept'}
              </button>
            )}
            { (r.status?.toLowerCase() === 'accepted') && (
              <button className="btn-disabled">Accepted</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MaidRequests;
