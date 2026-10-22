import * as v from 'valibot';

export const TeamModuleDataSchema = v.object({
  members: v.array(
    v.object({
      fullName: v.pipe(v.string(), v.nonEmpty()),
      role: v.pipe(v.string(), v.nonEmpty()),
      photoUrl: v.optional(v.string()),
    }),
  ),
});

export type TeamModuleData = v.InferOutput<typeof TeamModuleDataSchema>;
