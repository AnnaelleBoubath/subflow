import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const statutClass = { actif: 's-actif', expiré: 's-expiré', attente: 's-attente' };
const statutLabel = { actif: 'Actif', expiré: 'Expiré', attente: 'En attente' };
const fmt = (n) => new Intl.NumberFormat('fr-CG').format(n) + ' F';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(null);
  const [abonnes, setAbonnes]     = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([
      dashboardAPI.stats(),
      dashboardAPI.abonnesRecents(),
      dashboardAPI.paiementsRecents(),
    ])
      .then(([s, a, p]) => { setStats(s); setAbonnes(a); setPaiements(p); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error)   return <div className="page-error">Erreur : {error}</div>;

  return (
    <>
      {/* STATS */}
      <div className="stats-grid">
        {[
          { label: 'Total abonnés',       value: stats.total_abonnes,       sub: `${stats.abonnes_actifs} actifs`,     color: 'c1', icon: '👥' },
          { label: 'Abonnements actifs',  value: stats.abonnes_actifs,      sub: `${stats.abonnes_expires} expirés`,   color: 'c2', icon: '✅' },
          { label: 'Revenus du mois',     value: fmt(stats.revenus_mois),   sub: 'paiements validés',                  color: 'c3', icon: '💰' },
          { label: 'En attente',          value: stats.paiements_en_attente,sub: `${stats.paiements_annules} annulés`, color: 'c4', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val ${s.color}`}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* TABLE + PAIEMENTS */}
      <div className="bottom-grid">
        {/* Abonnés récents */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Abonnés récents</span>
            <button className="btn btn-outline" onClick={() => navigate('/abonnes')}>Voir tout →</button>
          </div>
          <table>
            <thead>
              <tr><th>Nom</th><th>Numéro</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {abonnes.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.prenom} {a.nom}</strong></td>
                  <td className="muted">{a.numero}</td>
                  <td>
                    <span className={`status-badge ${statutClass[a.statut]}`}>
                      {statutLabel[a.statut]}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => navigate('/abonnes')}>Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paiements récents */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Paiements récents</span>
            <button className="btn btn-outline" onClick={() => navigate('/paiements')}>Voir tout →</button>
          </div>
          <div className="payment-list">
            {paiements.map(p => (
              <div key={p.id} className="payment-item" onClick={() => navigate('/paiements')}>
                <div className={`pay-icon ${p.statut === 'payé' ? 'in' : 'out'}`}>
                  {p.statut === 'payé' ? '💳' : '⏰'}
                </div>
                <div className="pay-info">
                  <div className="pay-name">{p.abonne?.prenom} {p.abonne?.nom}</div>
                  <div className="pay-date">{p.date}</div>
                </div>
                <div className={`pay-amount ${p.statut === 'payé' ? 'in' : 'out'}`}>
                  {p.statut === 'payé' ? '+' : ''}{fmt(p.montant)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
