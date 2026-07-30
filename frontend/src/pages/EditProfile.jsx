import { useEffect, useState } from 'react';
import API from '../services/api';
import "./EditProfile.css";
import Navbar from "../components/Navbar";
import "../styles/manager.css";

function EditProfile(){
  const [profile, setProfile] = useState({
    age: "",
    gender: "female",
    address: "",
    experience: "",
    salary: "",
    availability: "Available",
    contact: "",
    skills: [],
    timings: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

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

  useEffect(()=>{ fetchProfile(); },[]);

  const fetchProfile = async ()=>{
    try{
      const res = await API.get('/maids/profile');
      if(res.data){
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
          timings: data.timings ? data.timings.split(',').filter(Boolean) : []
        });
        if(data.photo_url) setPhotoPreview(data.photo_url);
      }
    }catch(err){
      if(err.response?.status !== 404) console.error('Error loading profile', err);
    }finally{setLoading(false)}
  };

  const handleChange = (e)=>{
    setProfile({...profile, [e.target.name]: e.target.value});
  };

  const toggleCheckbox = (field, value) => {
    const current = profile[field] || [];
    if(current.includes(value)) setProfile({...profile, [field]: current.filter(i=>i!==value)});
    else setProfile({...profile, [field]: [...current, value]});
  };

  const handleSave = async (e)=>{
    if(e && e.preventDefault) e.preventDefault();
    if(!profile.contact || !profile.address || !profile.salary){ alert('Please fill in contact, address, and expected salary'); return; }
    setSaving(true);
    try{
      const payload = {
        ...profile,
        age: profile.age ? parseInt(profile.age) : null,
        experience: profile.experience ? parseInt(profile.experience) : null,
        salary: profile.salary ? parseFloat(profile.salary) : null,
        skills: (profile.skills || []).join(','),
        timings: (profile.timings || []).join(',')
      };
      let res;
      // use PUT to update
      res = await API.put('/maids/profile', payload);
      alert('Profile saved successfully!');
      // if backend returns photo_url, update local user and navbar
      try{
        const returned = res?.data;
        if(returned?.photo_url){
          const existing = JSON.parse(localStorage.getItem('user')) || {};
          const merged = { ...existing, photo_url: returned.photo_url };
          localStorage.setItem('user', JSON.stringify(merged));
          window.dispatchEvent(new Event('userUpdated'));
        }
      }catch(e){/* ignore */}
    }catch(err){
      console.error('Save failed', err);
      alert(err.response?.data || err.message || 'Save failed');
    }finally{setSaving(false)}
  };

  const handlePhotoChange = async (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    // upload to backend
    try{
      const form = new FormData();
      form.append('photo', file);
      const res = await API.post('/maids/profile/photo', form, { headers: {'Content-Type':'multipart/form-data'} });
      const photoUrl = res.data.photo_url;
      setPhotoPreview(photoUrl);
      // update profile locally
      setProfile(prev => ({...prev, photo_url: photoUrl}));
      // update navbar user so avatar updates for maid
      try{
        const existing = JSON.parse(localStorage.getItem('user')) || {};
        const merged = { ...existing, photo_url: photoUrl };
        localStorage.setItem('user', JSON.stringify(merged));
        window.dispatchEvent(new Event('userUpdated'));
      }catch(e){console.warn('Could not update localStorage user', e)}
    }catch(err){
      console.error('Upload failed', err);
      alert(err.response?.data || err.message || 'Upload failed');
    }
  };

  if(loading) return (<div><Navbar /><div className="dashboard-container" style={{textAlign:'center',padding:'4rem'}}><h2>Loading...</h2></div></div>);

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Edit Profile</h1>
            <p>Configure your professional profile</p>
          </div>
        </div>

        <div className="maid-dashboard-grid">
          <div className="profile-card">
            <h3>👤 Your Professional Profile</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="age">Age (Years)</label>
                  <input id="age" className="form-input" type="number" name="age" placeholder="e.g. 28" value={profile.age} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" className="form-input" name="gender" value={profile.gender} onChange={handleChange}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact">Contact Number</label>
                  <input id="contact" className="form-input" type="text" name="contact" placeholder="e.g. +91 9876543210" value={profile.contact} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Expected Salary (₹ / Month)</label>
                  <input id="salary" className="form-input" type="number" name="salary" placeholder="e.g. 12000" value={profile.salary} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label htmlFor="experience">Experience (Years)</label>
                  <input id="experience" className="form-input" type="number" name="experience" placeholder="e.g. 4" value={profile.experience} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label htmlFor="availability">Work Status</label>
                  <select id="availability" className="form-input" name="availability" value={profile.availability} onChange={handleChange}>
                    <option value="Available">Available (Looking for bookings)</option>
                    <option value="Unavailable">Unavailable (Fully booked / Leave)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Service Address / Area</label>
                  <input id="address" className="form-input" type="text" name="address" placeholder="e.g. Bandra West, Mumbai" value={profile.address} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label>Skills Offered</label>
                <div className="checkbox-group-container">
                  <div className="checkbox-grid">
                    {skillOptions.map((s)=> (
                      <label key={s} className="checkbox-label">
                        <input type="checkbox" checked={(profile.skills||[]).includes(s)} onChange={()=>toggleCheckbox('skills', s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Available Shifts</label>
                <div className="checkbox-group-container">
                  <div className="checkbox-grid">
                    {timingOptions.map((t)=> (
                      <label key={t} className="checkbox-label">
                        <input type="checkbox" checked={(profile.timings||[]).includes(t.split(' ')[0])} onChange={()=>toggleCheckbox('timings', t.split(' ')[0])} />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <br />
              <button type="submit" className="save-profile-btn" disabled={saving}>{saving? 'Saving...' : 'Save Profile'}</button>
            </form>
          </div>

          <div className="sidebar-panel">
            <div className="info-box">
              <h3>Profile Photo</h3>
              <div style={{textAlign:'center',paddingTop:8}}>
                <div className="photo-preview" style={{width:140,height:140,borderRadius:8,overflow:'hidden',margin:'0 auto',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {photoPreview ? <img src={photoPreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div className="muted">No Photo</div>}
                </div>
                <div style={{marginTop:12}}>
                  <input id="maid-photo" type="file" accept="image/*" style={{display:'none'}} onChange={handlePhotoChange} />
                  <label htmlFor="maid-photo" className="btn-secondary">Upload Photo</label>
                </div>
              </div>
            </div>

            <div className="info-box">
              <h3>Tips</h3>
              <p style={{fontSize:'0.9rem'}}>Keep your availability and service address updated. Good photos increase trust and bookings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
