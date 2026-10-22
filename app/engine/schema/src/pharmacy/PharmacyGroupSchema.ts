import * as v from 'valibot';
import { ModuleNameSchema } from '../modules/ModuleNameSchema';

/** Le groupement auquel la pharmacie adhère (Giphar, Pharmavie…). */
export const PharmacyGroupSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  logoUrl: v.optional(v.string()),
  /** Les modules que le groupement impose à ses pharmacies : elles ne peuvent pas les désactiver. */
  mandatoryModules: v.optional(v.array(ModuleNameSchema), []),
});

export type PharmacyGroup = v.InferOutput<typeof PharmacyGroupSchema>;
