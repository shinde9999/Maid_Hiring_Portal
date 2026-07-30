import { useEffect, useState } from "react";
import API from "../services/api";
import MaidCard from "../components/MaidCard";
import Navbar from "../components/Navbar";
import "./MaidList.css";

function MaidList() {

  const [maids,setMaids] = useState([]);
  const [filterSkill, setFilterSkill] = useState('');
  const [quickView, setQuickView] = useState(null);

  useEffect(()=>{ 
    fetchMaids(); 
    const onFilter = (e) => setFilterSkill(e.detail || '');
    const onQuick = (e) => setQuickView(e.detail || null);
    window.addEventListener('filterBySkill', onFilter);
    window.addEventListener('quickViewMaid', onQuick);
    return () => { window.removeEventListener('filterBySkill', onFilter); window.removeEventListener('quickViewMaid', onQuick); };
  },[]);

  const fetchMaids = async()=>{
    try{ const res = await API.get("/maids"); setMaids(res.data); }catch(err){ console.log(err); }
  };

  const visible = filterSkill ? maids.filter(m => (m.skills||'').split(',').map(s=>s.trim()).includes(filterSkill)) : maids;

  return (
    <div>
      <Navbar />

      <div className="maids-container">
        <h2>
          Available Maids
        </h2>

        { filterSkill && <div className="filter-pill">Filtering by: <strong>{filterSkill}</strong> <button onClick={()=>setFilterSkill('')}>Clear</button></div> }

        {
          visible.map((maid)=>(
            <MaidCard 
              key={maid.id} 
              maid={maid} 
              onSkillClick={(skill)=>setFilterSkill(skill)} 
              onBookClick={()=>alert('Booking flow coming soon')} 
            />
          )) 
        }

      </div>

      { quickView && (
        <div className="quick-modal">
          <div className="quick-modal-content">
            <h3>{quickView.name}</h3>
            <p>{quickView.address}</p>
            <p>Skills: {(quickView.skills||'').split(',').join(', ')}</p>
            <button onClick={()=>setQuickView(null)}>Close</button>
          </div>
        </div>
      ) }

    </div>
  );
}

export default MaidList;