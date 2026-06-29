import { useState, useEffect } from 'react';

const BASE_URL = 'https://subflow-api-844f.onrender.com';
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

const TYPES = [
  { value: 'rappel_paiement', label: 'Rappel paiement', icon: '💳' },
  { value: 'confirmation', label: 'Confirmation', icon: '✅' },
  { value: 'expiration', label: 'Expiration', icon: '⚠️' },
  { value: 'personnalise', label: 'Message personnalisé', icon: '✏️' },
];

const statutMeta = {
  simule: { label: 'Simulé', css: 's-attente' },
  envoye: { label: 'Envoyé', css: 's-actif' },
  echec: { label: 'Échec', css: 's-expiré' },
};

function SMSModal({ abonnes, onSend, onClose }) {
  const [mode, setMode] = useState('unique');
  const [abonneId, setAId] = useState('');
  const [selectedIds, setSIds] = useState([]);
  const [type, setType] = useState('rappel_paiement');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  const toggleSelect = (id) => {
    setSIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSend = async () => {
    const e = {};
    if (mode === 'unique' && !abonneId) e.abonne = 'Sélectionner un abonné';
    if (mode === 'bulk' && selectedIds.length === 0) e.abonne = 'Sélectionner au moins un abonné';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    try {
      if (mode === 'unique') {
        await onSend('unique', { abonne_id: Number(abonneId), type, message: message || undefined });
      } else if (mode === 'bulk') {
        await onSend('bulk', { abonne_ids: selectedIds, type, message: message || undefined });
      } else {
        await onSend('rappels', {});
      }
      onClose();
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Envoyer un SMS</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {errors.global && <div className="login-error">{errors.global}</div>}
          <div className="form-group">
            <label>Mode d'envoi</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'unique', label: '👤 Un abonné' },
                { value: 'bulk', label: '👥 Plusieurs' },
                { value: 'rappels', label: '⚠️ Expirés auto' },
              ].map(m => (
                <button key={m.value}
                  className={'btn' + (mode === m.value ? ' btn-accent' : ' btn-outline')}
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={() => setMode(m.value)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === 'unique' && (
            <div className="form-group">
              <label>Abonné</label>
              <select className={'input' + (errors.abonne ? ' error' : '')}
                value={abonneId} onChange={e => setAId(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {abonnes.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom} — {a.numero}</option>)}
              </select>
              {errors.abonne && <span className="form-error">{errors.abonne}</span>}
            </div>
          )}

          {mode === 'bulk' && (
            <div className="form-group">
              <label>Abonnés ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})</label>
              {errors.abonne && <span className="form-error">{errors.abonne}</span>}
              <div style={{ maxHeight: 160, overflowY: 'auto', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', padding: 8, marginTop: 4 }}>
                {abonnes.map(a => (
                  <div key={a.id} onClick={() => toggleSelect(a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', background: selectedIds.includes(a.id) ? 'rgba(108,99,255,.15)' : 'transparent' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (selectedIds.includes(a.id) ? 'var(--accent)' : 'var(--border)'), background: selectedIds.includes(a.id) ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>
                      {selectedIds.includes(a.id) ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: 13 }}>{a.prenom} {a.nom}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>{a.numero}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'rappels' && (
            <div style={{ background: 'rgba(255,169,77,.08)', border: '1px solid rgba(255,169,77,.3)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--accent4)', lineHeight: 1.6 }}>
              ⚠️ Envoie automatiquement un SMS à tous les abonnés expirés.
            </div>
          )}

          {mode !== 'rappels' && (
            <div className="form-group">
              <label>Type de message</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t.value}
                    className={'btn' + (type === t.value ? ' btn-accent' : ' btn-outline')}
                    style={{ fontSize: 12, textAlign: 'left', padding: '8px 12px' }}
                    onClick={() => setType(t.value)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode !== 'rappels' && type === 'personnalise' && (
            <div className="form-group">
              <label>Message ({message.length}/160)</label>
              <textarea className="input" rows={3} maxLength={160}
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Votre message personnalisé..."
                style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn btn-accent" onClick={handleSend} disabled={sending}>
            {sending ? 'Envoi...' : '📩 Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [smsList, setSmsList] = useState([]);
  const [stats, setStats] = useState(null);
  const [abonnes, setAbonnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const [s, st, a] = await Promise.all([
        apiFetch('/api/sms'),
        apiFetch('/api/sms/stats'),
        apiFetch('/api/abonnes'),
      ]);
      setSmsList(s); setStats(st); setAbonnes(a);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const handleSend = async (mode, data) => {
    let res;
    if (mode === 'unique') res = await apiFetch('/api/sms/envoyer', { method: 'POST', body: JSON.stringify(data) });
    if (mode === 'bulk') res = await apiFetch('/api/sms/envoyer-bulk', { method: 'POST', body: JSON.stringify(data) });
    if (mode === 'rappels') res = await apiFetch('/api/sms/rappels-expiration', { method: 'POST' });
    showToast(mode === 'unique' ? 'SMS envoyé !' : res.envoyes + ' SMS envoyés !');
    load();
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: 'var(--accent2)', color: '#000', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13, zIndex: 200 }}>
          ✅ {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-h1">Notifications SMS</h1>
          <p className="page-sub">{stats ? stats.total : 0} SMS envoyés au total</p>
        </div>
        <button className="btn btn-accent" onClick={() => setModal(true)}>📩 Envoyer un SMS</button>
      </div>

      {stats && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 22 }}>
          <div className="stat-card c2">
            <div className="stat-label">Total</div>
            <div className="stat-val c2" style={{ fontSize: 28 }}>{stats.total}</div>
            <div className="stat-icon">📩</div>
          </div>
          <div className="stat-card c3">
            <div className="stat-label">Simulés</div>
            <div className="stat-val c3" style={{ fontSize: 28 }}>{stats.simules}</div>
            <div className="stat-icon">🔬</div>
          </div>
          <div className="stat-card c1">
            <div className="stat-label">Réels</div>
            <div className="stat-val c1" style={{ fontSize: 28 }}>{stats.envoyes}</div>
            <div className="stat-icon">✅</div>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        🔬 <strong style={{ color: 'var(--text)' }}>Mode simulation actif</strong> — Les SMS sont enregistrés mais pas réellement envoyés.
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Historique des SMS</span>
        </div>
        <table>
          <thead>
            <tr><th>Destinataire</th><th>Numéro</th><th>Type</th><th>Message</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {smsList.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                Aucun SMS — cliquez sur "Envoyer un SMS" pour commencer
              </td></tr>
            ) : smsList.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.abonne_nom || '—'}</td>
                <td className="muted">{s.numero}</td>
                <td><span className="type-badge type-standard" style={{ fontSize: 11 }}>{TYPES.find(t => t.value === s.type)?.label}</span></td>
                <td className="muted" style={{ fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.message}</td>
                <td><span className={'status-badge ' + (statutMeta[s.statut] ? statutMeta[s.statut].css : '')}>{statutMeta[s.statut] ? statutMeta[s.statut].label : s.statut}</span></td>
                <td className="muted" style={{ fontSize: 12 }}>{s.cree_le ? s.cree_le.slice(0, 16).replace('T', ' ') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <SMSModal abonnes={abonnes} onSend={handleSend} onClose={() => setModal(false)} />}
    </>
  );
}
