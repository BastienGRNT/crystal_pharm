# `home` — accueil, connexion, fiche de la pharmacie

Monté sur `/` par `pharmacy/host`.

- Connexion et inscription (ouverte à tous, le compte inscrit devient Owner de
  la pharmacie qu'il crée) : les écrans de `ui`, branchés sur le client de
  `shared/auth` (`@crystal-pharm/auth/client`). Un Employee crée son compte
  depuis son invitation (`/invitation/<jeton>`). Le `load` du cadre des outils
  (la personne connectée) est ici.
- L'équipe et ses accès (inviter un Employee, créer le CounterAccount, choisir
  les Responsibilities, nommer un Owner) : réservés aux Owners, par les
  fonctions de `shared/pharmacy-db`.
- La page d'accueil des outils ; le menu vient de `AppShell`.
- La fiche de la pharmacie (coordonnées) et ses Employees : lues et écrites
  par les fonctions de `shared/pharmacy-db`, jamais par une requête Drizzle
  propre à `home`.
- Le groupement de la pharmacie (invitation, adhésion, départ) et son
  abonnement (choix des Tools, paiement, résiliation) : réservés aux Owners,
  par les fonctions de `shared/group-db` et `shared/billing-db`.
- Le menu ne montre que les Tools accessibles et permis par les
  Responsibilities du TenantMember ; l'accès à un Tool fermé est
  refusé par le hook de `pharmacy/host` (`createToolAccessHandle`), qui renvoie
  vers `/abonnement`.
- Pas de schéma propre.
