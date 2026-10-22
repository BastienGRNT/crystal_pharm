import * as v from 'valibot';

export const neighborhoodSettingsSchema = v.object({
  slogan: v.optional(v.string(), 'Votre pharmacie de quartier, toujours à votre écoute.'),
  /** Par défaut, pas de photo : le hero affiche une illustration aux couleurs du layout. */
  heroImageUrl: v.optional(v.string()),
  showOnDutyBanner: v.optional(v.boolean(), true),
});

export type NeighborhoodSettings = v.InferOutput<typeof neighborhoodSettingsSchema>;
