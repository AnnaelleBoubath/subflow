import { useState } from 'react';

const FAQ = [
  {
    q: 'Comment ajouter un nouvel abonné ?',
    a: "Rendez-vous dans la section Abonnés, puis cliquez sur le bouton « + Nouvel abonné ». Remplissez le formulaire avec le nom, prénom, numéro, adresse, type d'abonnement et statut, puis validez.",
  },
  {
    q: 'Comment enregistrer un paiement ?',
    a: "Allez dans la section Paiements et cliquez sur « + Enregistrer un paiement ». Sélectionnez l'abonné, saisissez le montant, la date, le type et le statut du paiement.",
  },
  {
    q: 'Comment modifier la grille tarifaire ?',
    a: "Dans la section Tarifs, vous pouvez ajouter de nouveaux tarifs, modifier les tarifs existants ou les supprimer. Chaque tarif est défini par un type (Basic, Standard, Premium), un prix et une durée.",
  },
  {
    q: 'Quelle est la différence entre les rôles Administrateur et Agent ?',
    a: "L'Administrateur a un accès complet à toutes les fonctionnalités, y compris la gestion des tarifs et la suppression de données. L'Agent peut consulter et enregistrer des paiements, mais n'a pas accès aux paramètres sensibles.",
  },
  {
    q: 'Comment rechercher un abonné rapidement ?',
    a: 'Utilisez la barre de recherche en haut de la page Abonnés. Vous pouvez rechercher par nom, prénom, numéro de téléphone ou adresse. Des filtres supplémentaires permettent de trier par type ou statut.',
  },
  {
    q: 'Comment exporter les données ?',
    a: "La fonctionnalité d'export sera disponible dans une prochaine mise à jour. Elle permettra d'exporter les listes d'abonnés et d'historiques de paiements en format CSV ou PDF.",
  },
];

const GUIDES = [
  {
    titre: 'Démarrage rapide',
    icon: '🚀',
    etapes: [
      'Connectez-vous avec vos identifiants administrateur.',
      'Configurez la grille tarifaire dans la section Tarifs.',
      'Ajoutez vos premiers abonnés dans la section Abonnés.',
      'Enregistrez les paiements au fur et à mesure dans la section Paiements.',
      'Consultez le tableau de bord pour suivre les statistiques en temps réel.',
    ],
  },
  {
    titre: 'Gestion des abonnés',
    icon: '👥',
    etapes: [
      'Accédez à la section Abonnés depuis le menu latéral.',
      'Utilisez la recherche et les filtres pour trouver un abonné.',
      'Cliquez sur « + Nouvel abonné » pour créer un abonné.',
      'Utilisez le bouton ✏️ pour modifier un abonné existant.',
      'Le bouton 🗑 permet de supprimer un abonné (avec confirmation).',
    ],
  },
  {
    titre: 'Suivi des paiements',
    icon: '💳',
    etapes: [
      'Accédez à la section Paiements depuis le menu latéral.',
      'Les cartes de statistiques résument le total encaissé, en attente et annulé.',
      'Enregistrez un nouveau paiement via le bouton dédié.',
      'Filtrez par statut (Payé, En attente, Annulé) ou par type.',
      'Cliquez sur 👁 pour voir le détail complet d\'un paiement.',
    ],
  },
];

/* ── Accordéon FAQ ── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
}

/* ── Page principale ── */
export default function Aide() {
  const [onglet, setOnglet] = useState('guide'); // 'guide' | 'faq' | 'support'

  return (
    <>
      {/* EN-TÊTE */}
      <div className="page-header">
        <div>
          <h1 className="page-h1">Aide & Support</h1>
          <p className="page-sub">Documentation, FAQ et contact</p>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="onglets">
        {[
          { id: 'guide',   label: '📖 Guide d\'utilisation' },
          { id: 'faq',     label: '❓ FAQ' },
          { id: 'support', label: '📧 Contacter le support' },
        ].map(o => (
          <button
            key={o.id}
            className={`onglet-btn${onglet === o.id ? ' active' : ''}`}
            onClick={() => setOnglet(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* GUIDE */}
      {onglet === 'guide' && (
        <div className="aide-grid">
          {GUIDES.map(g => (
            <div key={g.titre} className="card guide-card">
              <div className="guide-head">
                <span className="guide-icon">{g.icon}</span>
                <h3 className="guide-titre">{g.titre}</h3>
              </div>
              <ol className="guide-etapes">
                {g.etapes.map((e, i) => (
                  <li key={i} className="guide-etape">
                    <span className="etape-num">{i + 1}</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {onglet === 'faq' && (
        <div style={{ maxWidth: 720, marginTop: 16 }}>
          {FAQ.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      )}

      {/* SUPPORT */}
      {onglet === 'support' && (
        <div style={{ maxWidth: 560, marginTop: 16 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, marginBottom: 6 }}>Envoyer un message</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Notre équipe répond dans un délai de 24h ouvrées.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Sujet</label>
                <input className="input" placeholder="Ex : Problème de connexion" />
              </div>
              <div className="form-group">
                <label>Type de demande</label>
                <select className="input">
                  <option>Problème technique</option>
                  <option>Question fonctionnelle</option>
                  <option>Demande d'évolution</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Décrivez votre problème ou question en détail…"
                  style={{ resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
              <button className="btn btn-accent" style={{ alignSelf: 'flex-end' }}>
                Envoyer le message
              </button>
            </div>
          </div>

          {/* Infos contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            {[
              { icon: '📧', label: 'Email', val: 'support@subflow.cg' },
              { icon: '📞', label: 'Téléphone', val: '+242 06 000 0000' },
            ].map(c => (
              <div key={c.label} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{c.label}</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{c.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
