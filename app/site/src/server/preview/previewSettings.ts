import { query } from '@solidjs/router';

/** La seule origine dont l'aperçu accepte des données : l'app des pharmacies, où vit site-manager. */
export function readPreviewParentOrigin(): string {
  const pharmacyUrl = process.env.PHARMACY_URL;
  if (!pharmacyUrl) throw new Error('PHARMACY_URL is missing from the environment.');
  return new URL(pharmacyUrl).origin;
}

export const getPreviewParentOrigin = query(async () => {
  'use server';
  return readPreviewParentOrigin();
}, 'preview-parent-origin');
