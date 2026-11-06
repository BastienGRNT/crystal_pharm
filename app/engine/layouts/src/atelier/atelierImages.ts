import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const atelierImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'lavande',
    proposals: [
      { key: 'lavande', label: 'Champ de lavande', file: 'hero/lavande.jpg' },
      { key: 'huiles-essentielles', label: 'Huiles essentielles', file: 'hero/huiles-essentielles.jpg' },
      { key: 'camomille-coquelicots', label: 'Camomille et coquelicots', file: 'hero/camomille-coquelicots.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'cercles', label: 'Cercles', file: 'article/cercles.svg' },
      { key: 'demi-lune', label: 'Demi-lune', file: 'article/demi-lune.svg' },
    ],
  },
};
