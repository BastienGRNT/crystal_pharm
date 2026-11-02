import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const showcaseImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'lavande',
    proposals: [
      { key: 'lavande', label: 'Champ de lavande', file: 'hero/lavande.jpg' },
      { key: 'huiles-essentielles', label: 'Huiles essentielles', file: 'hero/huiles-essentielles.jpg' },
      { key: 'petit-dejeuner-fruits', label: 'Petit-déjeuner aux fruits', file: 'hero/petit-dejeuner-fruits.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'galets', label: 'Galets', file: 'article/galets.svg' },
      { key: 'arc', label: 'Arc', file: 'article/arc.svg' },
    ],
  },
};
