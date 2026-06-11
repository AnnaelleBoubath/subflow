const BASE_URL = 'https://subflow-api-844f.onrender.com';

function getToken() {
  return localStorage.getItem('subflow_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
    window.location.href = '/login';
    throw new Error('Non authentifie');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
    throw new Error(err.detail || 'Erreur ' + res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const authAPI = {
  login: async (email, mot_de_passe) => {
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, mot_de_passe }) });
    if (res.token) {
      localStorage.setItem('subflow_token', res.token);
      localStorage.setItem('subflow_user', JSON.stringify(res.user));
    }
    return res;
  },
  logout: async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('subflow_token');
    localStorage.removeItem('subflow_user');
  },
  me: () => apiFetch('/api/auth/me'),
};

export const dashboardAPI = {
  stats:            () => apiFetch('/api/dashboard/stats'),
  abonnesRecents:   () => apiFetch('/api/dashboard/abonnes-recents'),
  paiementsRecents: () => apiFetch('/api/dashboard/paiements-recents'),
};

export const abonnesAPI = {
  liste:    (params = {}) => { const q = new URLSearchParams(params).toString(); return apiFetch('/api/abonnes' + (q ? '?' + q : '')); },
  get:      (id)       => apiFetch('/api/abonnes/' + id),
  creer:    (data)     => apiFetch('/api/abonnes',         { method: 'POST',   body: JSON.stringify(data) }),
  modifier: (id, data) => apiFetch('/api/abonnes/' + id,  { method: 'PUT',    body: JSON.stringify(data) }),
  supprimer:(id)       => apiFetch('/api/abonnes/' + id,  { method: 'DELETE' }),
};

export const paiementsAPI = {
  liste:    (params = {}) => { const q = new URLSearchParams(params).toString(); return apiFetch('/api/paiements' + (q ? '?' + q : '')); },
  get:      (id)       => apiFetch('/api/paiements/' + id),
  creer:    (data)     => apiFetch('/api/paiements',        { method: 'POST',   body: JSON.stringify(data) }),
  modifier: (id, data) => apiFetch('/api/paiements/' + id, { method: 'PUT',    body: JSON.stringify(data) }),
  supprimer:(id)       => apiFetch('/api/paiements/' + id, { method: 'DELETE' }),
};

export const tarifsAPI = {
  liste:    (params = {}) => { const q = new URLSearchParams(params).toString(); return apiFetch('/api/tarifs' + (q ? '?' + q : '')); },
  get:      (id)       => apiFetch('/api/tarifs/' + id),
  creer:    (data)     => apiFetch('/api/tarifs',        { method: 'POST',   body: JSON.stringify(data) }),
  modifier: (id, data) => apiFetch('/api/tarifs/' + id, { method: 'PUT',    body: JSON.stringify(data) }),
  supprimer:(id)       => apiFetch('/api/tarifs/' + id, { method: 'DELETE' }),
};
