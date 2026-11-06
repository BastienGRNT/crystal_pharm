import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { atelierImages } from './atelierImages';

export const atelierSettingsSchema = v.object({
  backgroundColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--at-color-background', defaultColor: '#f6f1e7' }),
  surfaceColor: themeColorSetting({ title: 'Couleur des cartes', cssVariable: '--at-color-surface', defaultColor: '#fffcf5' }),
  textColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--at-color-text', defaultColor: '#1d1a16' }),
  /** Le texte blanc des boutons se pose dessus : une teinte assez soutenue. */
  accentColor: themeColorSetting({
    title: 'Couleur d’accent',
    cssVariable: '--at-color-accent',
    defaultColor: '#b4532a',
    legacyColors: { terracotta: '#b4532a', sage: '#3f6f52', saffron: '#9a6a00' },
  }),
  displayFont: themeChoiceSetting({
    title: 'Police des titres',
    cssVariable: '--at-font-display',
    options: {
      instrumentSerif: { label: 'Éditoriale (Instrument Serif)', cssValue: "'Instrument Serif', 'Times New Roman', serif" },
      fraunces: { label: 'Chaleureuse (Fraunces)', cssValue: "'Fraunces', Georgia, serif" },
    },
    defaultOption: 'instrumentSerif',
  }),
});

export type AtelierSettings = v.InferOutput<typeof atelierSettingsSchema>;

export const atelierManifest: LayoutManifest = {
  label: 'Atelier',
  description: 'Éditorial, comme un beau magazine : grande typographie, sections numérotées, des couleurs et une police de titres au choix.',
  settingsSchema: atelierSettingsSchema,
  orderableModules: ['services', 'brands', 'appointment', 'onlineOrder', 'dutyHotline', 'loyaltyCard', 'news'],
  themePresets: [
    { key: 'terracotta', label: 'Terre cuite', settings: { backgroundColor: '#f6f1e7', surfaceColor: '#fffcf5', textColor: '#1d1a16', accentColor: '#b4532a', displayFont: 'instrumentSerif' } },
    { key: 'sage', label: 'Sauge', settings: { backgroundColor: '#eef1ea', surfaceColor: '#fafcf7', textColor: '#18201b', accentColor: '#3f6f52', displayFont: 'fraunces' } },
    { key: 'saffron', label: 'Safran', settings: { backgroundColor: '#f8f3e4', surfaceColor: '#fffdf4', textColor: '#201b10', accentColor: '#9a6a00', displayFont: 'instrumentSerif' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'textColor', background: 'backgroundColor' },
    { label: 'Texte sur les cartes', foreground: 'textColor', background: 'surfaceColor' },
    { label: 'Texte blanc des boutons', foreground: '#ffffff', background: 'accentColor' },
  ],
  images: atelierImages,
};
