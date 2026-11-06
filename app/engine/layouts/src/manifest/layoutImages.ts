/// <reference types="vite/client" />
import { findLayoutManifest } from './layoutManifests';
import type { LayoutImage, LayoutImageSlot } from './LayoutManifest';

// Vite remplace cet appel par l'adresse de chaque fichier : chaque app (le site, la gestion du site) obtient la sienne, servie par son propre domaine.
const imageFileUrls: Record<string, string> = import.meta.glob('../*/images/*/*.{jpg,jpeg,webp,png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function listLayoutImageProposals(layoutId: string, slot: LayoutImageSlot): LayoutImage[] {
  return findLayoutManifest(layoutId)?.images?.[slot]?.proposals ?? [];
}

export function findLayoutDefaultImage(layoutId: string, slot: LayoutImageSlot): LayoutImage | undefined {
  const catalog = findLayoutManifest(layoutId)?.images?.[slot];
  return catalog?.proposals.find((image) => image.key === catalog.defaultImageKey);
}

export function toLayoutImageFileUrl(layoutId: string, image: LayoutImage): string | undefined {
  return imageFileUrls[`../${layoutId}/images/${image.file}`];
}

/** Une clé qu'aucune proposition du layout ne porte (le Manager a changé de layout) retombe sur le défaut. */
export function findLayoutImageUrl(layoutId: string, slot: LayoutImageSlot, imageKey: string): string | undefined {
  const image = listLayoutImageProposals(layoutId, slot).find((proposal) => proposal.key === imageKey);
  return image && toLayoutImageFileUrl(layoutId, image);
}

export function findLayoutDefaultImageUrl(layoutId: string, slot: LayoutImageSlot): string | undefined {
  const image = findLayoutDefaultImage(layoutId, slot);
  return image && toLayoutImageFileUrl(layoutId, image);
}
