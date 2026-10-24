import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const neighborhoodSettingsSchema = v.object({
  slogan: v.optional(v.pipe(v.string(), v.title('Slogan')), 'Votre pharmacie de quartier, toujours à votre écoute.'),
  /** Par défaut, pas de photo : le hero affiche une illustration aux couleurs du layout. */
  heroImageUrl: v.optional(v.pipe(v.string(), v.title('Photo d’en-tête (URL)'))),
  showOnDutyBanner: v.optional(v.pipe(v.boolean(), v.title('Afficher le bandeau de garde')), true),
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
  description: 'Une pharmacie de quartier chaleureuse, avec un grand en-tête et le bandeau de garde.',
  settingsSchema: neighborhoodSettingsSchema,
};
