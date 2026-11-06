import { themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { essentialImages } from './essentialImages';

/** Le layout essentiel ne contient que l'obligatoire : seules ses trois couleurs se règlent. */
export const essentialSettingsSchema = v.object({
  paperColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--essential-color-paper', defaultColor: '#f2f1ec' }),
  inkColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--essential-color-ink', defaultColor: '#0b0b0b' }),
  highlightColor: themeColorSetting({ title: 'Couleur des bandeaux', cssVariable: '--essential-color-highlight', defaultColor: '#0b0b0b' }),
  onHighlightColor: themeColorSetting({ title: 'Couleur du texte des bandeaux', cssVariable: '--essential-color-on-highlight', defaultColor: '#f2f1ec' }),
});

export type EssentialSettings = v.InferOutput<typeof essentialSettingsSchema>;

export const essentialManifest: LayoutManifest = {
  label: 'Essentiel',
  description: 'Une seule page sobre, avec l’obligatoire et rien d’autre.',
  settingsSchema: essentialSettingsSchema,
  themePresets: [
    { key: 'paper', label: 'Papier', settings: { paperColor: '#f2f1ec', inkColor: '#0b0b0b', highlightColor: '#0b0b0b', onHighlightColor: '#f2f1ec' } },
    { key: 'lemon', label: 'Citron', settings: { paperColor: '#f7f3d6', inkColor: '#111111', highlightColor: '#111111', onHighlightColor: '#f7f3d6' } },
    { key: 'sage', label: 'Sauge', settings: { paperColor: '#e9efe6', inkColor: '#10201a', highlightColor: '#1f4d3a', onHighlightColor: '#e9efe6' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'inkColor', background: 'paperColor' },
    { label: 'Texte des bandeaux', foreground: 'onHighlightColor', background: 'highlightColor' },
  ],
  images: essentialImages,
};
