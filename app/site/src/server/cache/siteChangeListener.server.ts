import postgres from 'postgres';
import { evictAllPages, evictPagesOfGroup, evictPagesOfTenant } from './sitePageCache.server';
import { parseSiteChangeNotification } from './siteChangeNotification';

export const siteChangeChannelName = 'tenant_site_changed';

let isListening = false;
let listeningStarted = false;

/** Tant que l'écoute n'est pas établie, aucune notification n'est garantie : le cache ne sert à rien. */
export function isSiteChangeListenerConnected(): boolean {
  return isListening;
}

export function evictPagesAfterNotification(payload: string): void {
  const notification = parseSiteChangeNotification(payload);
  if (notification.kind === 'tenant') evictPagesOfTenant(notification.id);
  else if (notification.kind === 'group') evictPagesOfGroup(notification.id);
  else evictAllPages();
}

/**
 * Une connexion LISTEN dédiée par instance (jamais derrière pgbouncer en mode transaction :
 * il ne garde pas la session où l'écoute est posée). À chaque (re)connexion, tout le cache
 * est vidé : des notifications ont pu être perdues pendant la coupure.
 */
export function startListeningToSiteChanges(): void {
  if (listeningStarted) return;
  listeningStarted = true;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
  const listeningConnection = postgres(databaseUrl, {
    max: 1,
    onclose: () => {
      isListening = false;
      evictAllPages();
    },
  });
  listeningConnection
    .listen(siteChangeChannelName, evictPagesAfterNotification, () => {
      evictAllPages();
      isListening = true;
    })
    .catch(() => {
      listeningStarted = false;
      isListening = false;
      console.error('Site : l’écoute des changements est impossible, le cache des pages reste vide.');
    });
}
