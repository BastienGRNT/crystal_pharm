import * as v from 'valibot';

export const BrandsModuleDataSchema = v.object({
  brands: v.array(
    v.object({
      name: v.pipe(v.string(), v.nonEmpty()),
      logoUrl: v.optional(v.string()),
      url: v.optional(v.pipe(v.string(), v.url())),
    }),
  ),
});

export type BrandsModuleData = v.InferOutput<typeof BrandsModuleDataSchema>;
