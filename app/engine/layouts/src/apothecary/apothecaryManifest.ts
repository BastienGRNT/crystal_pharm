import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { apothecaryImages } from './apothecaryImages';

export const apothecarySettingsSchema = v.object({
  /** Le texte crème et les filets dorés se posent dessus : une teinte sombre. Ses nuances (foncée, panneau) en sont tirées par le CSS. */
  woodColor: themeColorSetting({
    title: 'Couleur des boiseries',
    cssVariable: '--ap-color-wood',
    defaultColor: '#13372a',
    legacyColors: { bottleGreen: '#13372a', prussianBlue: '#1b2f4b', bordeaux: '#4a1c24' },
  }),
  paperColor: themeColorSetting({ title: 'Couleur du papier (fond)', cssVariable: '--ap-color-paper', defaultColor: '#f5eedd' }),
  inkColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--ap-color-ink', defaultColor: '#23201a' }),
  goldColor: themeColorSetting({ title: 'Couleur des dorures', cssVariable: '--ap-color-gold', defaultColor: '#c9a55a' }),
  formRadius: themeChoiceSetting({
    title: 'Angles des champs de formulaire',
    cssVariable: '--ap-form-radius',
    options: {
      square: { label: 'Droits', cssValue: '0' },
      soft: { label: 'Adoucis', cssValue: '4px' },
      round: { label: 'Arrondis', cssValue: '10px' },
    },
    defaultOption: 'square',
  }),
  showOrnaments: v.pipe(v.optional(v.boolean(), true), v.title('Ornements (étiquettes et fleurons)')),
});

export type ApothecarySettings = v.InferOutput<typeof apothecarySettingsSchema>;

export const apothecaryManifest: LayoutManifest = {
  label: 'Apothicaire',
  description: 'L’officine d’autrefois : boiseries, nom de la pharmacie sur une étiquette de bocal, services rangés dans des tiroirs.',
  settingsSchema: apothecarySettingsSchema,
  orderableModules: ['appointment', 'services', 'team', 'news', 'onlineOrder', 'loyaltyCard', 'brands'],
  themePresets: [
    { key: 'bottleGreen', label: 'Vert bouteille', settings: { woodColor: '#13372a', paperColor: '#f5eedd', inkColor: '#23201a', goldColor: '#c9a55a', formRadius: 'square' } },
    { key: 'prussianBlue', label: 'Bleu de Prusse', settings: { woodColor: '#1b2f4b', paperColor: '#eef0f2', inkColor: '#1d2230', goldColor: '#c9a55a', formRadius: 'square' } },
    { key: 'bordeaux', label: 'Bordeaux', settings: { woodColor: '#4a1c24', paperColor: '#f6ebe3', inkColor: '#2a1a1c', goldColor: '#c9a55a', formRadius: 'soft' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le papier', foreground: 'inkColor', background: 'paperColor' },
    { label: 'Texte crème sur les boiseries', foreground: '#f5eedd', background: 'woodColor' },
  ],
  images: apothecaryImages,
};
