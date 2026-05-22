import { useState, useEffect, useMemo } from 'react';
import { paiementsAPI, abonnesAPI } from '../services/api';

const statutMeta = {
  'payé':        { label:'Payé',        css:'s-actif'   },
  'en attente':  { label:'En attente',  css:'s-attente' },
  'annulé':      { label:'Annulé',      css:'s-expiré'  },
};
const STATUTS = ['payé','en attente','annulé'];
const fmt = (n) => new Intl.NumberFormat('fr-CG').format(n) + ' F';

function PaiementModal({ initial, abonnes, onSave, onClose }) {
  const today = new Date().toISOString().slice(0,10);
  const empty = { abonne_id:'', montant:'', date:today, statut:'en attente', note:'' };
  const [form, setForm] = useState(initial ? {...initial, montant:String(initial.montant), abonne_id:String(initial.abonne_id)} : empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const validate = () => {
    const e = {};
    if (!form.abonne_id)                                    e.abonne  = 'Requis';
    if (!form.montant || isNaN(+form.montant) || +form.montant<=0) e.montant = 'Invalide';
    if (!form.date)                                         e.date    = 'Requis';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave({...form, montant:Number(form.montant), abonne_id:Number(form.abonne_id)}); }
    catch(err) { setErrors({global:err.message}); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">{initial?'Modifier le paiement':'Enregistrer un paiement'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors.global && <div className="login-error">{errors.global}</div>}
          <div className="form-group">
            <label>Abonné</label>
            <select className={`input${errors.abonne?' error':''}`} value={form.abonne_id} onChange={e=>set('abonne_id',e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {abonnes.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
            </select>
            {errors.abonne && <span className="form-error">{errors.abonne}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Montant (FCFA)</label>
              <input className={`input${errors.montant?' error':''}`} type="number" min="0" value={form.montant} onChange={e=>set('montant',e.target.value)} placeholder="10000"/>
              {errors.montant && <span className="form-error">{errors.montant}</span>}
            </div>
            <div className="form-group">
              <label>Date</label>
              <input className={`input${errors.date?' error':''}`} type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Statut</label>
              <select className="input" value={form.statut} onChange={e=>set('statut',e.target.value)}>
                {STATUTS.map(s=><option key={s} value={s}>{statutMeta[s].label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Note (optionnel)</label>
              <input className="input" value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="Remarque…"/>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving?'Enregistrement...':initial?'Enregistrer':'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [abonnes, setAbonnes]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterStatut, setFS]     = useState('');
  const [modal, setModal]         = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([paiementsAPI.liste(), abonnesAPI.liste()])
      .then(([p,a]) => { setPaiements(p); setAbonnes(a); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const totalPayé    = paiements.filter(p=>p.statut==='payé').reduce((s,p)=>s+p.montant,0);
  const totalAttente = paiements.filter(p=>p.statut==='en attente').reduce((s,p)=>s+p.montant,0);
  const totalAnnulé  = paiements.filter(p=>p.statut==='annulé').reduce((s,p)=>s+p.montant,0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return paiements.filter(p =>
      (!q || `${p.abonne?.prenom||''} ${p.abonne?.nom||''} ${p.montant}`.toLowerCase().includes(q)) &&
      (!filterStatut || p.statut === filterStatut)
    );
  }, [paiements, search, filterStatut]);

  const handleAdd  = async (data) => { await paiementsAPI.creer(data);              load(); setModal(null); };
  const handleEdit = async (data) => { await paiementsAPI.modifier(modal.paiement.id, data); load(); setModal(null); };
  const handleDel  = async ()     => { await paiementsAPI.supprimer(modal.paiement.id);      load(); setModal(null); };

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error)   return <div className="page-error">Erreur : {error}</div>;

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-h1">Paiements</h1><p className="page-sub">{paiements.length} transactions</p></div>
        <button className="btn btn-accent" onClick={()=>setModal('add')}>+ Enregistrer un paiement</button>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:22}}>
        {[
          {label:'Total encaissé', value:fmt(totalPayé),   sub:`${paiements.filter(p=>p.statut==='payé').length} paiements`,  color:'c2', icon:'✅'},
          {label:'En attente',     value:fmt(totalAttente),sub:`${paiements.filter(p=>p.statut==='en attente').length} à vérifier`,color:'c3',icon:'⏳'},
          {label:'Annulés',        value:fmt(totalAnnulé), sub:`${paiements.filter(p=>p.statut==='annulé').length} annulations`,color:'c4',icon:'❌'},
        ].map(s=>(
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val ${s.color}`} style={{fontSize:24}}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{flex:1,maxWidth:320}}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button className="clear-btn" onClick={()=>setSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={filterStatut} onChange={e=>setFS(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s=><option key={s} value={s}>{statutMeta[s].label}</option>)}
        </select>
        {(search||filterStatut) && <button className="btn btn-outline" onClick={()=>{setSearch('');setFS('');}}>Réinitialiser</button>}
      </div>

      <div className="card" style={{marginTop:16}}>
        <table>
          <thead><tr><th>#</th><th>Abonné</th><th>Montant</th><th>Date</th><th>Statut</th><th>Note</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan="7" style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>Aucun paiement trouvé</td></tr>
            ) : filtered.map(p=>(
              <tr key={p.id}>
                <td className="muted" style={{fontSize:12}}>{p.id}</td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div className="abonne-avatar" style={{fontSize:10}}>
                      {(p.abonne?.prenom?.[0]||'?')}{(p.abonne?.nom?.[0]||'?')}
                    </div>
                    <span style={{fontWeight:500}}>{p.abonne?.prenom} {p.abonne?.nom}</span>
                  </div>
                </td>
                <td style={{fontFamily:'var(--font-head)',fontWeight:700,color:p.statut==='payé'?'var(--accent2)':p.statut==='annulé'?'var(--accent3)':'var(--accent4)'}}>{fmt(p.montant)}</td>
                <td className="muted" style={{fontSize:12}}>{p.date}</td>
                <td><span className={`status-badge ${statutMeta[p.statut].css}`}>{statutMeta[p.statut].label}</span></td>
                <td className="muted" style={{fontSize:12}}>{p.note||'—'}</td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    <button className="action-btn" onClick={()=>setModal({type:'edit',paiement:p})}>✏️</button>
                    <button className="action-btn action-btn-danger" onClick={()=>setModal({type:'delete',paiement:p})}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length>0 && (
          <div className="table-foot">
            <span className="muted" style={{fontSize:12}}>{filtered.length} résultat{filtered.length>1?'s':''}</span>
          </div>
        )}
      </div>

      {modal==='add'          && <PaiementModal abonnes={abonnes} onSave={handleAdd}  onClose={()=>setModal(null)}/>}
      {modal?.type==='edit'   && <PaiementModal initial={modal.paiement} abonnes={abonnes} onSave={handleEdit} onClose={()=>setModal(null)}/>}
      {modal?.type==='delete' && (
        <div className="modal-backdrop" onClick={()=>setModal(null)}>
          <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 className="modal-title">Confirmer</h2><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
            <div className="modal-body"><p style={{color:'var(--muted)',lineHeight:1.6}}>Supprimer ce paiement ? Action irréversible.</p></div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={handleDel}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
