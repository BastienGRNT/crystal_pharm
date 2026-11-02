import * as v from 'valibot';
import { FindUsSectionDataSchema } from './FindUsSectionDataSchema';
import { HeroSectionDataSchema } from './HeroSectionDataSchema';
import { OpeningHoursSectionDataSchema } from './OpeningHoursSectionDataSchema';

/**
 * Les sections fixes : toujours affichées, ni activables ni déplaçables par la pharmacie, jamais imposées par un groupement.
 * Le bandeau de garde se déduit des périodes de garde des horaires.
 */
export const FixedSectionsSchema = v.object({
  hero: v.optional(HeroSectionDataSchema, {}),
  findUs: v.optional(FindUsSectionDataSchema, {}),
  openingHours: OpeningHoursSectionDataSchema,
});

export type FixedSections = v.InferOutput<typeof FixedSectionsSchema>;
