import * as v from 'valibot';

export const PrescriptionUploadModuleDataSchema = v.object({
  introduction: v.optional(v.string()),
});

export type PrescriptionUploadModuleData = v.InferOutput<typeof PrescriptionUploadModuleDataSchema>;
