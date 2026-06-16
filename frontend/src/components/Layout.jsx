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
        <main className="content" style={{position:"relative"}}>
          <div style={{
            position:"fixed",
            top:"50%",
            left:"55%",
            transform:"translate(-50%, -50%) rotate(-30deg)",
            fontSize:"120px",
            fontWeight:"900",
            color:"rgba(255,255,255,0.04)",
            pointerEvents:"none",
            zIndex:0,
            whiteSpace:"nowrap",
            userSelect:"none",
            fontFamily:"Arial"
          }}>BKV COLLECT</div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
