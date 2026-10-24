import { mkdirSync, watch } from 'node:fs';

const quietDelayInMilliseconds = 400;

/**
 * Le build de l'aperçu recompile le moteur et les layouts à chaque sauvegarde, en plusieurs fichiers : on prévient dès le premier,
 * puis une seule fois quand plus rien ne bouge, pour ne recharger l'aperçu qu'une fois.
 */
export function watchCompiledSite(compiledSiteDirectory: string, listeners: { onRebuilding: () => void; onRebuilt: () => void }): () => void {
  mkdirSync(compiledSiteDirectory, { recursive: true });
  let quietTimer: NodeJS.Timeout | undefined;
  const watcher = watch(compiledSiteDirectory, { recursive: true }, () => {
    if (quietTimer === undefined) listeners.onRebuilding();
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      quietTimer = undefined;
      listeners.onRebuilt();
    }, quietDelayInMilliseconds);
  });
  return () => {
    clearTimeout(quietTimer);
    watcher.close();
  };
}
