import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const atelierSettingsSchema = v.object({
  /** La couleur d'accent, choisie dans une palette fermée pour garder un rendu soigné. */
  accentTone: v.optional(
    v.pipe(
      v.picklist(['terracotta', 'sage', 'saffron']),
      v.title('Couleur d’accent'),
      v.metadata({ optionLabels: { terracotta: 'Terre cuite', sage: 'Sauge', saffron: 'Safran' } }),
    ),
    'terracotta',
  ),
  editorialHeadline: v.optional(v.pipe(v.string(), v.title('Accroche')), 'Prendre soin, simplement.'),
});

export type AtelierSettings = v.InferOutput<typeof atelierSettingsSchema>;

export const atelierManifest: LayoutManifest = {
  label: 'Atelier',
  description: 'Une mise en page éditoriale, en grille asymétrique, avec une couleur d’accent au choix.',
  settingsSchema: atelierSettingsSchema,
};
