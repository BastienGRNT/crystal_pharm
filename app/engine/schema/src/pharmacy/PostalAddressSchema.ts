import * as v from 'valibot';

export const PostalAddressSchema = v.object({
  street: v.pipe(v.string(), v.nonEmpty()),
  postalCode: v.pipe(v.string(), v.regex(/^\d{5}$/)),
  city: v.pipe(v.string(), v.nonEmpty()),
});

export type PostalAddress = v.InferOutput<typeof PostalAddressSchema>;
