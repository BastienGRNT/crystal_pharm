import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { clearImages } from './clearImages';

export const clearSettingsSchema = v.object({
  /** Une palette fermée : chaque teinte garde un contraste suffisant en texte blanc et sur le blanc du layout. */
  accentColor: themeChoiceSetting({
    title: 'Couleur d’accent',
    cssVariable: '--cl-color-accent',
    options: {
      officineGreen: { label: 'Vert officine', cssValue: '#0a7a4f' },
      blue: { label: 'Bleu', cssValue: '#1f56c9' },
      ink: { label: 'Encre', cssValue: '#0d1b26' },
    },
    defaultOption: 'officineGreen',
  }),
});

export type ClearSettings = v.InferOutput<typeof clearSettingsSchema>;

export const clearManifest: LayoutManifest = {
  label: 'Clair',
  description: 'Précis et lumineux : blanc pur, filets fins, une seule couleur d’accent, les horaires de la semaine en sept colonnes.',
  settingsSchema: clearSettingsSchema,
  images: clearImages,
};
