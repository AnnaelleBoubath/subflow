import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const BASE_URL = 'http://localhost:8000';
function getToken() { return localStorage.getItem('subflow_token'); }
async function apiFetch(path) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

const fmt = (n) => new Intl.NumberFormat('fr-CG').format(n) + ' F';

const COLORS = {
  accent:  '#6c63ff',
  accent2: '#00e5b0',
  accent3: '#ff6b6b',
  accent4: '#ffa94d',
};

const STATUT_COLORS = {
  actif:        '#00e5b0',
  expiré:       '#ff6b6b',
  attente:      '#ffa94d',
  payé:         '#00e5b0',
  'en attente': '#ffa94d',
  annulé:       '#ff6b6b',
};

const TYPE_COLORS = {
  Basic:    '#7a82a6',
  Standard: '#6c63ff',
  Premium:  '#ffa94d',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name} : <strong>{p.name === 'Revenus' ? fmt(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Statistiques() {
  const [stats, setStats]     = useState(null);
  const [mensuelles, setMens] = useState([]);
  const [abonnes, setAb]      = useState(null);
  const [paiements, setPaie]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/dashboard/stats'),
      apiFetch('/api/dashboard/stats-mensuelles'),
      apiFetch('/api/dashboard/stats-abonnes'),
      apiFetch('/api/dashboard/stats-paiements'),
    ])
      .then(([s, m, a, p]) => { setStats(s); setMens(m); setAb(a); setPaie(p); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Chargement...</div>;
  if (error)   return <div className="page-error">Erreur : {error}</div>;

  const totalRevenus = mensuelles.reduce((s, m) => s + m.revenus, 0);
  const moyenneRev   = mensuelles.length ? totalRevenus / mensuelles.length : 0;

  const pieStatut = (abonnes?.par_statut || []).map(s => ({
    name:  s.statut === 'actif' ? 'Actif' : s.statut === 'expiré' ? 'Expiré' : 'En attente',
    value: s.total,
    color: STATUT_COLORS[s.statut] || COLORS.accent,
  }));

  const pieType = (abonnes?.par_type || []).filter(t => t.total > 0).map(t => ({
    name:  t.type,
    value: t.total,
    color: TYPE_COLORS[t.type] || COLORS.accent,
  }));

  const paiementsData = paiements.map(p => ({
    name:   p.statut === 'payé' ? 'Payé' : p.statut === 'en attente' ? 'En attente' : 'Annulé',
    total:  p.total,
    montant:p.montant,
    color:  STATUT_COLORS[p.statut],
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-h1">Statistiques</h1>
          <p className="page-sub">Vue d'ensemble des performances</p>
        </div>
      </div>

      {/* STATS GLOBALES */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label:'Total abonnés',        value:stats.total_abonnes,         sub:`${stats.abonnes_actifs} actifs`,               color:'c1', icon:'👥' },
          { label:'Revenus 6 mois',       value:fmt(totalRevenus),            sub:`Moy. ${fmt(Math.round(moyenneRev))}/mois`,     color:'c2', icon:'💰' },
          { label:'En attente',           value:stats.paiements_en_attente,   sub:'paiements à vérifier',                        color:'c3', icon:'⏳' },
          { label:'Abonnés expirés',      value:stats.abonnes_expires,        sub:'à relancer',                                  color:'c4', icon:'⚠️' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val ${s.color}`} style={{ fontSize:26 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* GRAPHIQUES LIGNE + BARRE */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div className="card-title" style={{ marginBottom:16 }}>📈 Revenus mensuels</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mensuelles}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="mois" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone" dataKey="revenus" name="Revenus" stroke={COLORS.accent2} strokeWidth={2.5} dot={{ fill:COLORS.accent2, r:4 }} activeDot={{ r:6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div className="card-title" style={{ marginBottom:16 }}>📊 Paiements par mois</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mensuelles} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="mois" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="paiements" name="Paiements" fill={COLORS.accent} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPHIQUES PIE */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div className="card-title" style={{ marginBottom:16 }}>👥 Abonnés par statut</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieStatut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieStatut.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'var(--muted)', fontSize:11 }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div className="card-title" style={{ marginBottom:16 }}>🏷️ Abonnés par type</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieType.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'var(--muted)', fontSize:11 }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div className="card-title" style={{ marginBottom:16 }}>💳 Paiements par statut</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paiementsData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fill:'var(--muted)', fontSize:11 }} axisLine={false} tickLine={false} width={70}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="total" name="Nombre" radius={[0,4,4,0]}>
                {paiementsData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
