import * as v from 'valibot';

/** L'adresse et le téléphone viennent de `pharmacy` : ici, seulement ce qui aide à venir. */
export const FindUsSectionDataSchema = v.object({
  location: v.optional(
    v.object({
      latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
      longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
    }),
  ),
  accessInstructions: v.optional(v.pipe(v.string(), v.nonEmpty())),
  parking: v.optional(v.pipe(v.string(), v.nonEmpty())),
  publicTransport: v.optional(v.pipe(v.string(), v.nonEmpty())),
});

export type FindUsSectionData = v.InferOutput<typeof FindUsSectionDataSchema>;
