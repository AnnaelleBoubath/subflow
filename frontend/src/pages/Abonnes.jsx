import { useState, useEffect, useMemo } from 'react';
import { abonnesAPI, tarifsAPI } from '../services/api';

const statutMeta = {
  actif:   { label: 'Actif',      css: 's-actif'   },
  expiré:  { label: 'Expiré',     css: 's-expiré'  },
  attente: { label: 'En attente', css: 's-attente' },
};
const STATUTS = ['actif', 'attente', 'expiré'];

function AbonneModal({ initial, tarifs, onSave, onClose }) {
  const empty = { nom:'', prenom:'', numero:'', adresse:'', statut:'attente', tarif_id:'' };
  const [form, setForm] = useState(initial
    ? { ...initial, tarif_id: initial.tarif_id ?? '' }
    : empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const validate = () => {
    const e = {};
    if (!form.nom.trim())    e.nom    = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.numero.trim()) e.numero = 'Requis';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, tarif_id: form.tarif_id ? Number(form.tarif_id) : null };
      await onSave(payload);
    } catch(err) {
      setErrors({ global: err.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">{initial ? "Modifier l'abonné" : 'Nouvel abonné'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors.global && <div className="login-error">{errors.global}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <input className={`input${errors.nom?' error':''}`} value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Moukala"/>
              {errors.nom && <span className="form-error">{errors.nom}</span>}
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input className={`input${errors.prenom?' error':''}`} value={form.prenom} onChange={e=>set('prenom',e.target.value)} placeholder="Jean"/>
              {errors.prenom && <span className="form-error">{errors.prenom}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Numéro</label>
            <input className={`input${errors.numero?' error':''}`} value={form.numero} onChange={e=>set('numero',e.target.value)} placeholder="+242 06 000 0000"/>
            {errors.numero && <span className="form-error">{errors.numero}</span>}
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <input className="input" value={form.adresse||''} onChange={e=>set('adresse',e.target.value)} placeholder="Brazzaville, Poto-Poto"/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tarif</label>
              <select className="input" value={form.tarif_id||''} onChange={e=>set('tarif_id',e.target.value)}>
                <option value="">-- Aucun --</option>
                {tarifs.map(t => <option key={t.id} value={t.id}>{t.type} {t.duree}mois — {t.prix}F</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select className="input" value={form.statut} onChange={e=>set('statut',e.target.value)}>
                {STATUTS.map(s => <option key={s} value={s}>{statutMeta[s].label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ nom, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Confirmer la suppression</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{color:'var(--muted)',lineHeight:1.6}}>
            Supprimer <strong style={{color:'var(--text)'}}>{nom}</strong> ? Action irréversible.
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn btn-danger" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

export default function Abonnes() {
  const [abonnes, setAbonnes]     = useState([]);
  const [tarifs, setTarifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterStatut, setFS]     = useState('');
  const [modal, setModal]         = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([abonnesAPI.liste(), tarifsAPI.liste()])
      .then(([a, t]) => { setAbonnes(a); setTarifs(t); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return abonnes.filter(a =>
      (!q || `${a.nom} ${a.prenom} ${a.numero} ${a.adresse||''}`.toLowerCase().includes(q)) &&
      (!filterStatut || a.statut === filterStatut)
    );
  }, [abonnes, search, filterStatut]);

  const handleAdd  = async (data) => { await abonnesAPI.creer(data);         load(); setModal(null); };
  const handleEdit = async (data) => { await abonnesAPI.modifier(modal.abonne.id, data); load(); setModal(null); };
  const handleDel  = async ()     => { await abonnesAPI.supprimer(modal.abonne.id);      load(); setModal(null); };

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error)   return <div className="page-error">Erreur : {error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-h1">Abonnés</h1>
          <p className="page-sub">{abonnes.length} abonnés au total</p>
        </div>
        <button className="btn btn-accent" onClick={() => setModal('add')}>+ Nouvel abonné</button>
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{flex:1,maxWidth:340}}>
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
          <thead><tr><th>#</th><th>Nom complet</th><th>Numéro</th><th>Adresse</th><th>Tarif</th><th>Statut</th><th>Inscription</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>Aucun abonné trouvé</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id}>
                <td className="muted" style={{fontSize:12}}>{a.id}</td>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div className="abonne-avatar">{a.prenom[0]}{a.nom[0]}</div>
                    <span style={{fontWeight:500}}>{a.prenom} {a.nom}</span>
                  </div>
                </td>
                <td className="muted">{a.numero}</td>
                <td className="muted" style={{fontSize:12}}>{a.adresse}</td>
                <td>{a.tarif ? <span className={`type-badge type-${a.tarif.type.toLowerCase()}`}>{a.tarif.type}</span> : <span className="muted">—</span>}</td>
                <td><span className={`status-badge ${statutMeta[a.statut].css}`}>{statutMeta[a.statut].label}</span></td>
                <td className="muted" style={{fontSize:12}}>{a.date_inscription}</td>
                <td>
                  <div style={{display:'flex',gap:6}}>
                    <button className="action-btn" onClick={()=>setModal({type:'edit',abonne:a})}>✏️ Modifier</button>
                    <button className="action-btn action-btn-danger" onClick={()=>setModal({type:'delete',abonne:a})}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="table-foot">
            <span className="muted" style={{fontSize:12}}>{filtered.length} résultat{filtered.length>1?'s':''}{filtered.length!==abonnes.length?` sur ${abonnes.length}`:''}</span>
          </div>
        )}
      </div>

      {modal==='add' && <AbonneModal tarifs={tarifs} onSave={handleAdd} onClose={()=>setModal(null)}/>}
      {modal?.type==='edit'   && <AbonneModal initial={modal.abonne} tarifs={tarifs} onSave={handleEdit} onClose={()=>setModal(null)}/>}
      {modal?.type==='delete' && <ConfirmModal nom={`${modal.abonne.prenom} ${modal.abonne.nom}`} onConfirm={handleDel} onClose={()=>setModal(null)}/>}
    </>
  );
}
