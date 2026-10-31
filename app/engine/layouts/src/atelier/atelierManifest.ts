import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const atelierSettingsSchema = v.object({
  /** Une palette fermée : sur le fond sombre du layout, une couleur libre serait vite illisible. */
  accentTone: themeChoiceSetting({
    title: 'Couleur d’accent',
    cssVariable: '--at-color-accent',
    options: {
      terracotta: { label: 'Terre cuite', cssValue: '#d9774b' },
      sage: { label: 'Sauge', cssValue: '#8fb39a' },
      saffron: { label: 'Safran', cssValue: '#e8b64c' },
    },
    defaultOption: 'terracotta',
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
  description: 'Une mise en page éditoriale, en grille asymétrique, avec une couleur d’accent et une police de titres au choix.',
  settingsSchema: atelierSettingsSchema,
};
