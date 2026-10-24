import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const neighborhoodSettingsSchema = v.object({
  slogan: v.optional(v.pipe(v.string(), v.title('Slogan')), 'Votre pharmacie de quartier, toujours à votre écoute.'),
  /** Par défaut, pas de photo : le hero affiche une illustration aux couleurs du layout. */
  heroImageUrl: v.optional(v.pipe(v.string(), v.title('Photo d’en-tête (URL)'))),
  showOnDutyBanner: v.optional(v.pipe(v.boolean(), v.title('Afficher le bandeau de garde')), true),
});

export type NeighborhoodSettings = v.InferOutput<typeof neighborhoodSettingsSchema>;

export const neighborhoodManifest: LayoutManifest = {
  label: 'Quartier',
  description: 'Une pharmacie de quartier chaleureuse, avec un grand en-tête et le bandeau de garde.',
  settingsSchema: neighborhoodSettingsSchema,
};
