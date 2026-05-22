import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:8000';
function getToken() { return localStorage.getItem('subflow_token'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE_URL + path, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
    window.location.href = '/login';
    throw new Error('Non authentifie');
  }
  if (res.status === 204) return null;
  if (res.ok === false) {
    const err = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
    throw new Error(err.detail || 'Erreur ' + res.status);
  }
  return res.json();
}

const ROLES = ['admin', 'agent'];
const roleMeta = {
  admin: { label: 'Administrateur', css: 'type-premium', icon: '👑' },
  agent: { label: 'Agent', css: 'type-standard', icon: '👤' },
};

const EMPTY_FORM = { nom: '', prenom: '', email: '', mot_de_passe: '', role: 'agent' };

function UserModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, mot_de_passe: '' } : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.email.trim()) e.email = 'Requis';
    if (!initial && !form.mot_de_passe.trim()) e.mdp = 'Requis pour un nouvel utilisateur';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.mot_de_passe) delete payload.mot_de_passe;
      await onSave(payload);
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
          <h2 className="modal-title">{initial ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors.global && <div className="login-error">{errors.global}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Nom</label>
              <input className={'input' + (errors.nom ? ' error' : '')} value={form.nom}
                onChange={e => set('nom', e.target.value)} placeholder="Moukala" />
              {errors.nom && <span className="form-error">{errors.nom}</span>}
            </div>
            <div className="form-group">
              <label>Prénom</label>
              <input className={'input' + (errors.prenom ? ' error' : '')} value={form.prenom}
                onChange={e => set('prenom', e.target.value)} placeholder="Jean" />
              {errors.prenom && <span className="form-error">{errors.prenom}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className={'input' + (errors.email ? ' error' : '')} type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="jean@subflow.cg" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe {initial && <span style={{ color: 'var(--muted)', fontSize: 11 }}>(vide = inchangé)</span>}</label>
              <input className={'input' + (errors.mdp ? ' error' : '')} type="password" value={form.mot_de_passe}
                onChange={e => set('mot_de_passe', e.target.value)} placeholder="••••••••" />
              {errors.mdp && <span className="form-error">{errors.mdp}</span>}
            </div>
            <div className="form-group">
              <label>Rôle</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{roleMeta[r].label}</option>)}
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
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Confirmer la suppression</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Supprimer <strong style={{ color: 'var(--text)' }}>{nom}</strong> ? Action irréversible.
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

export default function Utilisateurs() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') navigate('/');
  }, [currentUser, navigate]);

  const load = () => {
    setLoading(true);
    apiFetch('/api/utilisateurs')
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (data) => { await apiFetch('/api/utilisateurs', { method: 'POST', body: JSON.stringify(data) }); load(); setModal(null); };
  const handleEdit = async (data) => { await apiFetch('/api/utilisateurs/' + modal.user.id, { method: 'PUT', body: JSON.stringify(data) }); load(); setModal(null); };
  const handleDel = async () => { await apiFetch('/api/utilisateurs/' + modal.user.id, { method: 'DELETE' }); load(); setModal(null); };

  const toggleActif = async (u) => {
    await apiFetch('/api/utilisateurs/' + u.id, { method: 'PUT', body: JSON.stringify({ est_actif: !u.est_actif }) });
    load();
  };

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error) return <div className="page-error">Erreur : {error}</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-h1">Utilisateurs</h1>
          <p className="page-sub">{users.length} comptes enregistrés</p>
        </div>
        <button className="btn btn-accent" onClick={() => setModal('add')}>+ Nouvel utilisateur</button>
      </div>

      <div className="users-grid">
        {users.map(u => (
          <div key={u.id} className={'user-card' + (!u.est_actif ? ' inactive' : '')}>
            <div className="user-card-top">
              <div className="user-big-avatar">{u.prenom[0]}{u.nom[0]}</div>
              <div className="user-card-info">
                <div className="user-card-name">{u.prenom} {u.nom}</div>
                <div className="user-card-email">{u.email}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <span className={'type-badge ' + (roleMeta[u.role] ? roleMeta[u.role].css : '')}>
                    {roleMeta[u.role] ? roleMeta[u.role].icon : ''} {roleMeta[u.role] ? roleMeta[u.role].label : u.role}
                  </span>
                  <span className={'status-badge ' + (u.est_actif ? 's-actif' : 's-expiré')}>
                    {u.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
            {u.id !== currentUser?.id ? (
              <div className="user-card-foot">
                <button className="action-btn" onClick={() => setModal({ type: 'edit', user: u })}>✏️ Modifier</button>
                <button className="action-btn" onClick={() => toggleActif(u)}>{u.est_actif ? '🔒 Désactiver' : '🔓 Activer'}</button>
                <button className="action-btn action-btn-danger" onClick={() => setModal({ type: 'delete', user: u })}>🗑</button>
              </div>
            ) : (
              <div className="user-card-foot">
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>👤 Votre compte</span>
                <button className="action-btn" onClick={() => setModal({ type: 'edit', user: u })}>✏️ Modifier</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal === 'add' && <UserModal onSave={handleAdd} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <UserModal initial={modal.user} onSave={handleEdit} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <ConfirmModal nom={modal.user.prenom + ' ' + modal.user.nom} onConfirm={handleDel} onClose={() => setModal(null)} />}
    </>
  );
}
