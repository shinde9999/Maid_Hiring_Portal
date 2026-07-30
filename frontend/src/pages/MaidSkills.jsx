import { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/manager.css";
import Navbar from "../components/Navbar";

function MaidSkills(){
  const [customSkill, setCustomSkill] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const suggestedSkills = [
    'Cooking', 'Cleaning', 'Baby Care', 'Elder Care', 'Laundry', 'Grocery Shopping',
    'Pet Care', 'Housekeeping', 'Ironing', 'Gardening', 'Tutoring', 'Car Washing',
    'Deep Cleaning', 'Sewing', 'Event Help'
  ];

  const toggleSuggested = (s) => {
    if (skillsList.includes(s)) setSkillsList(skillsList.filter(x=>x!==s));
    else setSkillsList([...skillsList, s]);
  };

  useEffect(()=>{
    loadSkills();
  },[]);

  const loadSkills = async ()=>{
    try{
      const res = await API.get('/maids/profile');
      const skills = res.data.skills ? res.data.skills.split(',').map(s=>s.trim()).filter(Boolean) : [];
      setSkillsList(skills);
    }catch(err){console.error(err)}
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if(!s) return;
    if(skillsList.includes(s)) return setCustomSkill('');
    setSkillsList([...skillsList, s]);
    setCustomSkill('');
  };

  const removeSkill = (s) => {
    const ok = window.confirm(`Remove skill "${s}"?`);
    if(!ok) return;
    setSkillsList(skillsList.filter(x=>x!==s));
  };

  const saveSkills = async () => {
    setSaving(true);
    try{
      await API.put('/maids/profile', { skills: skillsList.join(',') });
      setStatus('Saved');
      setTimeout(()=>setStatus(''),2000);
    }catch(err){
      alert(err.response?.data || err.message || 'Save failed');
    }finally{
      setSaving(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="manager-container">
       <div className="manager-header">
         <h2>Skills Manager</h2>
         <div className="manager-actions">
          <button className="btn-secondary" onClick={loadSkills} disabled={saving}>Reload</button>
          <button className="btn-primary" onClick={saveSkills} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
         </div>
       </div>

       <p>Manage the skills that appear on your public profile. Add custom skills and remove any that no longer apply.</p>

       <div style={{marginBottom:12}}>
         <div style={{fontWeight:700, marginBottom:8}}>Suggested skills</div>
         <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {suggestedSkills.map(s => (
            <button key={s} type="button" className={`btn-secondary suggested-skill ${skillsList.includes(s)?'active':''}`} onClick={()=>toggleSuggested(s)}>
              {s}
            </button>
          ))}
         </div>
       </div>

       <div className="form-row">
         <input placeholder="Add a skill" value={customSkill} onChange={(e)=>setCustomSkill(e.target.value)} />
        <button className="btn-primary" onClick={addCustomSkill} disabled={!customSkill.trim()}>Add Skill</button>
       </div>

       <div className="chips-row" aria-live="polite">
         {skillsList.map(s=> (
          <div key={s} className="chip">{s} <button className="chip-remove" onClick={()=>removeSkill(s)}>×</button></div>
         ))}
       </div>

       {status && <div className="status-msg">{status}</div>}

       <div className="accordion">
         <div className="accordion-item">
           <div className="accordion-title">How to write skills <span>+</span></div>
           <div className="accordion-body">Use short phrases like "Cooking" or "Baby Care". Separate multiple skills with commas when saving from other tools.</div>
         </div>
       </div>
      </div>
    </div>
   );
 }
 
 export default MaidSkills;
