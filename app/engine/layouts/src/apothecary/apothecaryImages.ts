import type { LayoutManifest } from '../manifest/LayoutManifest';

/** Les images de ce layout : les fichiers vivent dans `images/<emplacement>/`, à côté de ce fichier. */
export const apothecaryImages: NonNullable<LayoutManifest['images']> = {
  hero: {
    defaultImageKey: 'officine-boiseries',
    proposals: [
      { key: 'officine-boiseries', label: 'Officine et boiseries', file: 'hero/officine-boiseries.jpg' },
      { key: 'lavande', label: 'Champ de lavande', file: 'hero/lavande.jpg' },
      { key: 'camomille-coquelicots', label: 'Camomille et coquelicots', file: 'hero/camomille-coquelicots.jpg' },
    ],
  },
  article: {
    proposals: [
      { key: 'pilulier', label: 'Pilulier', file: 'article/pilulier.svg' },
      { key: 'feuille-or', label: 'Feuille d’or', file: 'article/feuille-or.svg' },
    ],
  },
};
