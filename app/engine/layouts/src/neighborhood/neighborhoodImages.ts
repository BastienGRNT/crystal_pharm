import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const neighborhoodImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'camomille-coquelicots',
    proposals: [
      { key: 'camomille-coquelicots', label: 'Camomille et coquelicots', file: 'hero/camomille-coquelicots.jpg' },
      { key: 'officine-boiseries', label: 'Officine et boiseries', file: 'hero/officine-boiseries.jpg' },
      { key: 'lavande', label: 'Champ de lavande', file: 'hero/lavande.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'bouquet', label: 'Bouquet', file: 'article/bouquet.svg' },
      { key: 'toits', label: 'Toits', file: 'article/toits.svg' },
    ],
  },
};
