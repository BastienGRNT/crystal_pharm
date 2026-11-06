import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { showcaseImages } from './showcaseImages';

export const showcaseSettingsSchema = v.object({
  groundColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--sc-color-ground', defaultColor: '#ffffff' }),
  inkColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--sc-color-ink', defaultColor: '#141414' }),
  /** Une teinte pâle : le texte doit rester lisible dessus. */
  tintColor: themeColorSetting({
    title: 'Teinte des pavés',
    cssVariable: '--sc-color-tint',
    defaultColor: '#f3e4dd',
    legacyColors: { powder: '#f3e4dd', sage: '#e2ebe3', sky: '#e1e8f1' },
  }),
  formRadius: themeChoiceSetting({
    title: 'Angles des champs de formulaire',
    cssVariable: '--sc-form-radius',
    options: {
      square: { label: 'Droits', cssValue: '0' },
      soft: { label: 'Adoucis', cssValue: '4px' },
      round: { label: 'Arrondis', cssValue: '12px' },
    },
    defaultOption: 'soft',
  }),
});

export type ShowcaseSettings = v.InferOutput<typeof showcaseSettingsSchema>;

export const showcaseManifest: LayoutManifest = {
  label: 'Vitrine',
  description: 'Comme une boutique de parapharmacie : une grande photo de l’officine en tête, une typographie de magazine, des pavés teintés.',
  settingsSchema: showcaseSettingsSchema,
  orderableModules: ['appointment', 'services', 'brands', 'team', 'news', 'onlineOrder', 'loyaltyCard'],
  themePresets: [
    { key: 'powder', label: 'Poudre', settings: { groundColor: '#ffffff', inkColor: '#141414', tintColor: '#f3e4dd', formRadius: 'soft' } },
    { key: 'sage', label: 'Sauge', settings: { groundColor: '#fbfcfa', inkColor: '#141a16', tintColor: '#e2ebe3', formRadius: 'square' } },
    { key: 'sky', label: 'Ciel', settings: { groundColor: '#fbfcfe', inkColor: '#12161c', tintColor: '#e1e8f1', formRadius: 'round' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'inkColor', background: 'groundColor' },
    { label: 'Texte sur les pavés teintés', foreground: 'inkColor', background: 'tintColor' },
  ],
  images: showcaseImages,
};
