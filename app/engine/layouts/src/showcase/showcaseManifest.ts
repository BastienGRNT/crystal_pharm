import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const showcaseSettingsSchema = v.object({
  /** Des teintes pâles seulement : le texte noir doit rester lisible sur chacune. */
  tintColor: themeChoiceSetting({
    title: 'Teinte des pavés',
    cssVariable: '--sc-color-tint',
    options: {
      powder: { label: 'Poudre', cssValue: '#f3e4dd' },
      sage: { label: 'Sauge', cssValue: '#e2ebe3' },
      sky: { label: 'Ciel', cssValue: '#e1e8f1' },
    },
    defaultOption: 'powder',
  }),
});

export type ShowcaseSettings = v.InferOutput<typeof showcaseSettingsSchema>;

export const showcaseManifest: LayoutManifest = {
  label: 'Vitrine',
  description: 'Comme une boutique de parapharmacie : une grande photo de l’officine en tête, une typographie de magazine, des pavés teintés.',
  settingsSchema: showcaseSettingsSchema,
};
