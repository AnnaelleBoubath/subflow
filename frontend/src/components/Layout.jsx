import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/': 'Tableau de bord',
  '/abonnes': 'Abonnés',
  '/paiements': 'Paiements',
  '/tarifs': 'Grille tarifaire',
  '/aide': 'Aide & Support',
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'SubFlow';

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar title={title} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
