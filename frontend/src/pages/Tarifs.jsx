import { useState, useEffect } from 'react';
import { tarifsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const TYPES  = ['Basic', 'Standard', 'Premium'];
const DUREES = [1, 3, 6, 12];
const dureeLabel = { 1: '1 mois', 3: '3 mois', 6: '6 mois', 12: '1 an' };
const fmt = (n) => new Intl.NumberFormat('fr-CG').format(n) + ' F';

const typeColors = {
  Basic:    { bg: 'rgba(122,130,166,.12)', color: 'var(--muted)',   icon: '🔵' },
  Standard: { bg: 'rgba(108,99,255,.12)',  color: 'var(--accent)',  icon: '🟣' },
  Premium:  { bg: 'rgba(255,169,77,.12)',  color: 'var(--accent4)', icon: '⭐' },
};

const EMPTY_FORM = { type: 'Standard', duree: 1, prix: '', description: '' };

/* ── Modal formulaire ── */
function TarifModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? { ...initial, prix: String(initial.prix) } : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.type)                                                      e.type = 'Requis';
    if (!form.prix || isNaN(Number(form.prix)) || Number(form.prix) <= 0) e.prix = 'Prix invalide';
    if (!form.description?.trim())                                        e.desc = 'Requis';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ ...form, prix: Number(form.prix), duree: Number(form.duree) });
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">{initial ? 'Modifier le tarif' : 'Nouveau tarif'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors.global && <div className="login-error">{errors.global}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className={`input${errors.type ? ' error' : ''}`}
                value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>
            <div className="form-group">
              <label>Durée</label>
              <select className="input" value={form.duree}
                onChange={e => set('duree', Number(e.target.value))}>
                {DUREES.map(d => <option key={d} value={d}>{dureeLabel[d]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Prix (FCFA)</label>
            <input className={`input${errors.prix ? ' error' : ''}`}
              type="number" min="0" value={form.prix}
              onChange={e => set('prix', e.target.value)} placeholder="10000" />
            {errors.prix && <span className="form-error">{errors.prix}</span>}
          </div>
          <div className="form-group">
            <label>Description</label>
            <input className={`input${errors.desc ? ' error' : ''}`}
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Description de l'offre…" />
            {errors.desc && <span className="form-error">{errors.desc}</span>}
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

/* ── Modal confirmation suppression ── */
function ConfirmModal({ nom, onConfirm, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Confirmer la suppression</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Supprimer le tarif <strong style={{ color: 'var(--text)' }}>{nom}</strong> ? Action irréversible.
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

/* ── Page principale ── */
export default function Tarifs() {
  const { user }                  = useAuth();
  const isAdmin                   = user?.role === 'admin';
  const [tarifs, setTarifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filterType, setFT]       = useState('');
  const [filterDuree, setFD]      = useState('');
  const [modal, setModal]         = useState(null);
  const [vue, setVue]             = useState('cartes');

  const load = () => {
    setLoading(true);
    tarifsAPI.liste()
      .then(setTarifs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = tarifs.filter(t =>
    (!filterType  || t.type  === filterType) &&
    (!filterDuree || t.duree === Number(filterDuree))
  );

  const handleAdd  = async (data) => { await tarifsAPI.creer(data);              load(); setModal(null); };
  const handleEdit = async (data) => { await tarifsAPI.modifier(modal.tarif.id, data); load(); setModal(null); };
  const handleDel  = async ()     => { await tarifsAPI.supprimer(modal.tarif.id);      load(); setModal(null); };

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error)   return <div className="page-error">Erreur : {error}</div>;

  return (
    <>
      {/* EN-TÊTE */}
      <div className="page-header">
        <div>
          <h1 className="page-h1">Grille tarifaire</h1>
          <p className="page-sub">{tarifs.length} offres disponibles</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="vue-toggle">
            <button className={`vue-btn${vue === 'cartes' ? ' active' : ''}`} onClick={() => setVue('cartes')}>⊞ Cartes</button>
            <button className={`vue-btn${vue === 'tableau' ? ' active' : ''}`} onClick={() => setVue('tableau')}>☰ Tableau</button>
          </div>
          {isAdmin && (
            <button className="btn btn-accent" onClick={() => setModal('add')}>+ Nouveau tarif</button>
          )}
        </div>
      </div>

      {/* FILTRES */}
      <div className="filters-bar">
        <select className="filter-select" value={filterType} onChange={e => setFT(e.target.value)}>
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterDuree} onChange={e => setFD(e.target.value)}>
          <option value="">Toutes les durées</option>
          {DUREES.map(d => <option key={d} value={d}>{dureeLabel[d]}</option>)}
        </select>
        {(filterType || filterDuree) && (
          <button className="btn btn-outline" onClick={() => { setFT(''); setFD(''); }}>Réinitialiser</button>
        )}
      </div>

      {/* VUE CARTES */}
      {vue === 'cartes' && (
        <div className="tarifs-grid">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)', gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>
              Aucun tarif trouvé
            </p>
          ) : filtered.map(t => {
            const tc = typeColors[t.type] || typeColors.Standard;
            return (
              <div key={t.id} className="tarif-card">
                <div className="tarif-card-top" style={{ background: tc.bg }}>
                  <span className="tarif-icon">{tc.icon}</span>
                  <span className="tarif-type" style={{ color: tc.color }}>{t.type}</span>
                  <span className="tarif-duree">{dureeLabel[t.duree]}</span>
                </div>
                <div className="tarif-card-body">
                  <div className="tarif-prix" style={{ color: tc.color }}>{fmt(t.prix)}</div>
                  <p className="tarif-desc">{t.description}</p>
                </div>
                {isAdmin && (
                  <div className="tarif-card-foot">
                    <button className="action-btn" onClick={() => setModal({ type: 'edit', tarif: t })}>✏️ Modifier</button>
                    <button className="action-btn action-btn-danger" onClick={() => setModal({ type: 'delete', tarif: t })}>🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VUE TABLEAU */}
      {vue === 'tableau' && (
        <div className="card" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Type</th><th>Prix</th><th>Durée</th><th>Description</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Aucun tarif trouvé</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td className="muted" style={{ fontSize: 12 }}>{t.id}</td>
                  <td><span className={`type-badge type-${t.type.toLowerCase()}`}>{t.type}</span></td>
                  <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: typeColors[t.type]?.color }}>{fmt(t.prix)}</td>
                  <td className="muted">{dureeLabel[t.duree]}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{t.description}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="action-btn" onClick={() => setModal({ type: 'edit', tarif: t })}>✏️ Modifier</button>
                        <button className="action-btn action-btn-danger" onClick={() => setModal({ type: 'delete', tarif: t })}>🗑</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="table-foot">
              <span className="muted" style={{ fontSize: 12 }}>
                {filtered.length} tarif{filtered.length > 1 ? 's' : ''}
                {filtered.length !== tarifs.length && ` sur ${tarifs.length}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {modal === 'add'          && <TarifModal onSave={handleAdd}  onClose={() => setModal(null)} />}
      {modal?.type === 'edit'   && <TarifModal initial={modal.tarif} onSave={handleEdit} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && (
        <ConfirmModal
          nom={`${modal.tarif.type} — ${dureeLabel[modal.tarif.duree]}`}
          onConfirm={handleDel}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
