import * as v from 'valibot';

export const LoyaltyCardModuleDataSchema = v.object({
  /** Toujours présent : c'est lui qui s'affiche quand il n'y a pas d'image. */
  text: v.pipe(v.string(), v.nonEmpty()),
  /** La page d'inscription au programme de fidélité. */
  url: v.pipe(v.string(), v.url()),
  imageUrl: v.optional(v.string()),
});

export type LoyaltyCardModuleData = v.InferOutput<typeof LoyaltyCardModuleDataSchema>;
