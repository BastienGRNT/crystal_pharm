import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { neighborhoodImages } from './neighborhoodImages';

export const neighborhoodSettingsSchema = v.object({
  /** Ses nuances (foncée, douce) en sont tirées par le CSS. */
  primaryColor: themeColorSetting({ title: 'Couleur principale', cssVariable: '--nb-color-primary', defaultColor: '#1f6b45' }),
  accentColor: themeColorSetting({ title: 'Couleur d’accent', cssVariable: '--nb-color-accent', defaultColor: '#f2b84b' }),
  headingFont: themeChoiceSetting({
    title: 'Police des titres',
    cssVariable: '--nb-font-heading',
    options: {
      fraunces: { label: 'Classique (Fraunces)', cssValue: "'Fraunces', Georgia, serif" },
      spaceGrotesk: { label: 'Moderne (Space Grotesk)', cssValue: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif" },
    },
    defaultOption: 'fraunces',
  }),
});

export type NeighborhoodSettings = v.InferOutput<typeof neighborhoodSettingsSchema>;

export const neighborhoodManifest: LayoutManifest = {
  label: 'Quartier',
  description: 'Chaleureux et très lisible : l’état d’ouverture en tête, les démarches en grand, une barre d’actions sur téléphone.',
  settingsSchema: neighborhoodSettingsSchema,
  images: neighborhoodImages,
};
