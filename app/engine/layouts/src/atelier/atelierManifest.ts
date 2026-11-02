import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { atelierImages } from './atelierImages';

export const atelierSettingsSchema = v.object({
  /** Une palette fermée : chaque teinte garde un contraste suffisant sur le papier du layout, ce qu'une couleur libre ne garantit pas. */
  accentTone: themeChoiceSetting({
    title: 'Couleur d’accent',
    cssVariable: '--at-color-accent',
    options: {
      terracotta: { label: 'Terre cuite', cssValue: '#b4532a' },
      sage: { label: 'Sauge', cssValue: '#3f6f52' },
      saffron: { label: 'Safran', cssValue: '#9a6a00' },
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
  description: 'Éditorial, comme un beau magazine : grande typographie, sections numérotées, une couleur d’accent et une police de titres au choix.',
  settingsSchema: atelierSettingsSchema,
  images: atelierImages,
};
