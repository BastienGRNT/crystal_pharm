import * as v from 'valibot';

/** Tout est facultatif : sans image ou sans accroche, le layout affiche les siennes. */
export const HeroSectionDataSchema = v.object({
  imageUrl: v.optional(v.string()),
  headline: v.optional(v.pipe(v.string(), v.nonEmpty())),
});

export type HeroSectionData = v.InferOutput<typeof HeroSectionDataSchema>;
