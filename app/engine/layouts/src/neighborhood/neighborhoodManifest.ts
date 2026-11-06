import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { neighborhoodImages } from './neighborhoodImages';

export const neighborhoodSettingsSchema = v.object({
  backgroundColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--nb-color-background', defaultColor: '#f7f3ea' }),
  surfaceColor: themeColorSetting({ title: 'Couleur des cartes', cssVariable: '--nb-color-surface', defaultColor: '#ffffff' }),
  textColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--nb-color-text', defaultColor: '#22211d' }),
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
  /** Les trois rayons du layout (petit, normal, grand) en sont tirés par le CSS. */
  cornerRadius: themeChoiceSetting({
    title: 'Arrondi des angles',
    cssVariable: '--nb-radius',
    options: {
      square: { label: 'Droits', cssValue: '0px' },
      soft: { label: 'Adoucis', cssValue: '8px' },
      round: { label: 'Arrondis', cssValue: '14px' },
      pill: { label: 'Très arrondis', cssValue: '22px' },
    },
    defaultOption: 'round',
  }),
});

export type NeighborhoodSettings = v.InferOutput<typeof neighborhoodSettingsSchema>;

export const neighborhoodManifest: LayoutManifest = {
  label: 'Quartier',
  description: 'Chaleureux et très lisible : l’état d’ouverture en tête, les démarches en grand, une barre d’actions sur téléphone.',
  settingsSchema: neighborhoodSettingsSchema,
  orderableModules: ['appointment', 'services', 'onlineOrder', 'team', 'news', 'loyaltyCard', 'brands'],
  themePresets: [
    { key: 'village', label: 'Village', settings: { backgroundColor: '#f7f3ea', surfaceColor: '#ffffff', textColor: '#22211d', primaryColor: '#1f6b45', accentColor: '#f2b84b', headingFont: 'fraunces', cornerRadius: 'round' } },
    { key: 'ocean', label: 'Océan', settings: { backgroundColor: '#f0f5f8', surfaceColor: '#ffffff', textColor: '#17222b', primaryColor: '#1d5f8a', accentColor: '#f2b84b', headingFont: 'spaceGrotesk', cornerRadius: 'soft' } },
    { key: 'lavender', label: 'Lavande', settings: { backgroundColor: '#f5f2fa', surfaceColor: '#ffffff', textColor: '#201c2b', primaryColor: '#5b4a99', accentColor: '#f2b84b', headingFont: 'fraunces', cornerRadius: 'pill' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'textColor', background: 'backgroundColor' },
    { label: 'Texte sur les cartes', foreground: 'textColor', background: 'surfaceColor' },
    { label: 'Texte blanc sur la couleur principale', foreground: '#ffffff', background: 'primaryColor' },
  ],
  images: neighborhoodImages,
};
