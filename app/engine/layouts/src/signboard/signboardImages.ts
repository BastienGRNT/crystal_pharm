import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const signboardImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'officine-boiseries',
    proposals: [
      { key: 'officine-boiseries', label: 'Officine et boiseries', file: 'hero/officine-boiseries.jpg' },
      { key: 'camomille-coquelicots', label: 'Camomille et coquelicots', file: 'hero/camomille-coquelicots.jpg' },
      { key: 'huiles-essentielles', label: 'Huiles essentielles', file: 'hero/huiles-essentielles.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'barres', label: 'Barres', file: 'article/barres.svg' },
      { key: 'anneau', label: 'Anneau', file: 'article/anneau.svg' },
    ],
  },
};
