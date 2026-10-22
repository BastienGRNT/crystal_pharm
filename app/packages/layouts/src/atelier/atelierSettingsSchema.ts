import * as v from 'valibot';

export const atelierSettingsSchema = v.object({
  /** La couleur d'accent, choisie dans une palette fermée pour garder un rendu soigné. */
  accentTone: v.optional(v.picklist(['terracotta', 'sage', 'saffron']), 'terracotta'),
  editorialHeadline: v.optional(v.string(), 'Prendre soin, simplement.'),
});

export type AtelierSettings = v.InferOutput<typeof atelierSettingsSchema>;
