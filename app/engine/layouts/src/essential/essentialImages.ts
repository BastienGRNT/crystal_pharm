import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const essentialImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'officine-boiseries',
    proposals: [
      { key: 'officine-boiseries', label: 'Officine et boiseries', file: 'hero/officine-boiseries.jpg' },
      { key: 'huiles-essentielles', label: 'Huiles essentielles', file: 'hero/huiles-essentielles.jpg' },
      { key: 'petit-dejeuner-fruits', label: 'Petit-déjeuner aux fruits', file: 'hero/petit-dejeuner-fruits.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'diagonale', label: 'Diagonale', file: 'article/diagonale.svg' },
      { key: 'points', label: 'Points', file: 'article/points.svg' },
    ],
  },
};
