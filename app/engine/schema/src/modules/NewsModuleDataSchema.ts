import * as v from 'valibot';

export const NewsModuleDataSchema = v.object({
  articles: v.array(
    v.object({
      title: v.pipe(v.string(), v.nonEmpty()),
      summary: v.pipe(v.string(), v.nonEmpty()),
      publishedAt: v.pipe(v.string(), v.isoDate()),
      imageUrl: v.optional(v.string()),
    }),
  ),
});

export type NewsModuleData = v.InferOutput<typeof NewsModuleDataSchema>;
