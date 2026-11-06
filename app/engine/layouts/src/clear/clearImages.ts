import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const clearImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'petit-dejeuner-fruits',
    proposals: [
      { key: 'petit-dejeuner-fruits', label: 'Petit-déjeuner aux fruits', file: 'hero/petit-dejeuner-fruits.jpg' },
      { key: 'lavande', label: 'Champ de lavande', file: 'hero/lavande.jpg' },
      { key: 'camomille-coquelicots', label: 'Camomille et coquelicots', file: 'hero/camomille-coquelicots.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'pastille', label: 'Pastille', file: 'article/pastille.svg' },
      { key: 'feuillage', label: 'Feuillage', file: 'article/feuillage.svg' },
    ],
  },
};
