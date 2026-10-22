# `home` — connexion et menu des outils

Servie à la racine du domaine des outils (`/`).

- Connexion : le formulaire appelle le C# (`/auth/login`) côté serveur, puis
  pose l'access token et le refresh token dans des cookies httpOnly,
  `Secure`, `SameSite=Lax`, sur le domaine des outils.
- Déconnexion : appelle le C# pour révoquer la session, puis supprime les
  cookies.
- La page d'accueil liste les outils ; le menu vient de `AppShell`.
- Aucune logique ni donnée métier, pas de Drizzle : une fonctionnalité qui a
  besoin de données appartient à une autre app.
