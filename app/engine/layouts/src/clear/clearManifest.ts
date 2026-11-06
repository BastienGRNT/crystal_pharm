import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { clearImages } from './clearImages';

export const clearSettingsSchema = v.object({
  groundColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--cl-color-ground', defaultColor: '#ffffff' }),
  panelColor: themeColorSetting({ title: 'Couleur des panneaux', cssVariable: '--cl-color-panel', defaultColor: '#f3f6f8' }),
  inkColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--cl-color-ink', defaultColor: '#0d1b26' }),
  /** Le texte blanc des boutons se pose dessus : une teinte assez soutenue. Sa nuance douce en est tirée par le CSS. */
  accentColor: themeColorSetting({
    title: 'Couleur d’accent',
    cssVariable: '--cl-color-accent',
    defaultColor: '#0a7a4f',
    legacyColors: { officineGreen: '#0a7a4f', blue: '#1f56c9', ink: '#0d1b26' },
  }),
  cornerRadius: themeChoiceSetting({
    title: 'Angles des champs de formulaire',
    cssVariable: '--cl-form-radius',
    options: {
      square: { label: 'Droits', cssValue: '0' },
      soft: { label: 'Adoucis', cssValue: '2px' },
      round: { label: 'Arrondis', cssValue: '10px' },
    },
    defaultOption: 'soft',
  }),
});

export type ClearSettings = v.InferOutput<typeof clearSettingsSchema>;

export const clearManifest: LayoutManifest = {
  label: 'Clair',
  description: 'Précis et lumineux : blanc pur, filets fins, une seule couleur d’accent, les horaires de la semaine en sept colonnes.',
  settingsSchema: clearSettingsSchema,
  orderableModules: ['appointment', 'services', 'team', 'news', 'onlineOrder', 'loyaltyCard', 'brands'],
  themePresets: [
    { key: 'officineGreen', label: 'Vert officine', settings: { groundColor: '#ffffff', panelColor: '#f3f6f8', inkColor: '#0d1b26', accentColor: '#0a7a4f', cornerRadius: 'soft' } },
    { key: 'blue', label: 'Bleu', settings: { groundColor: '#ffffff', panelColor: '#f1f5fb', inkColor: '#0d1b26', accentColor: '#1f56c9', cornerRadius: 'round' } },
    { key: 'ink', label: 'Encre', settings: { groundColor: '#fbfbfa', panelColor: '#f0f0ee', inkColor: '#0d1b26', accentColor: '#0d1b26', cornerRadius: 'square' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'inkColor', background: 'groundColor' },
    { label: 'Texte sur les panneaux', foreground: 'inkColor', background: 'panelColor' },
    { label: 'Texte blanc des boutons', foreground: '#ffffff', background: 'accentColor' },
  ],
  images: clearImages,
};
