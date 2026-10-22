import * as v from 'valibot';

export const ModuleNameSchema = v.picklist(['openingHours', 'team', 'services', 'news', 'prescriptionUpload', 'loyaltyCard']);

export type ModuleName = v.InferOutput<typeof ModuleNameSchema>;
