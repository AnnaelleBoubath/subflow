import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout        from './components/Layout';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Abonnes       from './pages/Abonnes';
import Paiements     from './pages/Paiements';
import Tarifs        from './pages/Tarifs';
import Aide          from './pages/Aide';
import Utilisateurs  from './pages/Utilisateurs';
import Notifications from './pages/Notifications';
import Statistiques  from './pages/Statistiques';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Chargement...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                  element={<Dashboard />}     />
            <Route path="abonnes"         element={<Abonnes />}       />
            <Route path="paiements"       element={<Paiements />}     />
            <Route path="tarifs"          element={<Tarifs />}        />
            <Route path="notifications"   element={<Notifications />} />
            <Route path="statistiques"    element={<Statistiques />}  />
            <Route path="utilisateurs"    element={<Utilisateurs />}  />
            <Route path="aide"            element={<Aide />}          />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
