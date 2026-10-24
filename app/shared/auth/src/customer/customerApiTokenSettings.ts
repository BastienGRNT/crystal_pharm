/** L'audience des jetons destinés au C# : la même valeur que `ManagerJwt__Audience` de `app/api`. */
export const apiTokenAudience = 'crystal-pharm-api';

/** Court : un compte désactivé perd l'accès au C# au plus tard à l'expiration de son jeton. */
export const apiTokenLifetime = '5m';
