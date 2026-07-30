import { useEffect, useState } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import './EditProfile.css';

function UserProfile(){
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ fetchProfile(); },[]);

  const fetchProfile = async ()=>{
    try{ const res = await API.get('/auth/profile'); setUser(res.data); if(res.data.photo_url) setPhotoPreview(res.data.photo_url); }catch(e){console.error(e)}finally{setLoading(false)}
  };

  const handleSave = async ()=>{
    setSaving(true);
    try{ const payload = { name: user.name, contact: user.contact, address: user.address, photo_url: user.photo_url }; const res = await API.put('/auth/profile', payload); setUser(res.data); alert('Saved');
      // update stored user so navbar reflects changes immediately
      const existing = JSON.parse(localStorage.getItem('user')) || {};
      const merged = { ...existing, ...res.data };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('userUpdated'));
     }catch(e){alert(e.response?.data||e.message)}finally{setSaving(false)}
  };

  const handlePhoto = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return; const url = URL.createObjectURL(f); setPhotoPreview(url);
    try{ const form = new FormData(); form.append('photo', f); const res = await API.post('/auth/profile/photo', form, { headers: {'Content-Type':'multipart/form-data'} }); setUser(prev=>({...prev, photo_url: res.data.photo_url})); setPhotoPreview(res.data.photo_url);
      // update local storage + navbar
      const existing = JSON.parse(localStorage.getItem('user')) || {};
      const merged = { ...existing, photo_url: res.data.photo_url };
      localStorage.setItem('user', JSON.stringify(merged));
      window.dispatchEvent(new Event('userUpdated'));
     }catch(err){alert(err.response?.data||err.message)}
  };

  if(loading) return <p>Loading...</p>;
  if(!user) return <p>No user found</p>;

  return (
    <div>
      <Navbar />
      <div className="edit-profile manager-container">
        <h2>My Profile</h2>

        <div style={{display:'flex',gap:16}}>
          <div style={{flex:1}}>
            <label>Full Name</label>
            <input value={user.name||''} onChange={(e)=>setUser({...user, name:e.target.value})} />

            <label>Contact</label>
            <input value={user.contact||''} onChange={(e)=>setUser({...user, contact:e.target.value})} />

            <label>Address</label>
            <input value={user.address||''} onChange={(e)=>setUser({...user, address:e.target.value})} />

            <div style={{marginTop:12}}>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
            </div>
          </div>

          <aside style={{width:220}}>
            <div style={{textAlign:'center'}}>
              <div className="photo-preview" style={{width:140,height:140,borderRadius:8,overflow:'hidden',margin:'0 auto',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {photoPreview ? <img src={photoPreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div className="muted">No Photo</div>}
              </div>
              <div style={{marginTop:12}}>
                <input id="user-photo" type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto} />
                <label htmlFor="user-photo" className="btn-secondary">Upload Photo</label>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;