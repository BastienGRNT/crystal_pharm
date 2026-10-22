import * as v from 'valibot';
import { PharmacyGroupSchema } from './PharmacyGroupSchema';
import { PostalAddressSchema } from './PostalAddressSchema';

/** Les informations de la pharmacie, communes à tous les layouts. */
export const PharmacyInfoSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  address: PostalAddressSchema,
  phone: v.pipe(v.string(), v.nonEmpty()),
  email: v.optional(v.pipe(v.string(), v.email())),
  logoUrl: v.optional(v.string()),
  group: v.optional(PharmacyGroupSchema),
});

export type PharmacyInfo = v.InferOutput<typeof PharmacyInfoSchema>;
