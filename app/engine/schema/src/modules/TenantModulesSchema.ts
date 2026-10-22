import * as v from 'valibot';
import { createToggleableModuleSchema } from './createToggleableModuleSchema';
import { LoyaltyCardModuleDataSchema } from './LoyaltyCardModuleDataSchema';
import type { ModuleName } from './ModuleNameSchema';
import { NewsModuleDataSchema } from './NewsModuleDataSchema';
import { OpeningHoursModuleDataSchema } from './OpeningHoursModuleDataSchema';
import { PrescriptionUploadModuleDataSchema } from './PrescriptionUploadModuleDataSchema';
import { ServicesModuleDataSchema } from './ServicesModuleDataSchema';
import { TeamModuleDataSchema } from './TeamModuleDataSchema';

export const TenantModulesSchema = v.object({
  openingHours: createToggleableModuleSchema(OpeningHoursModuleDataSchema),
  team: createToggleableModuleSchema(TeamModuleDataSchema),
  services: createToggleableModuleSchema(ServicesModuleDataSchema),
  news: createToggleableModuleSchema(NewsModuleDataSchema),
  prescriptionUpload: createToggleableModuleSchema(PrescriptionUploadModuleDataSchema),
  loyaltyCard: createToggleableModuleSchema(LoyaltyCardModuleDataSchema),
} satisfies Record<ModuleName, v.GenericSchema>);

export type TenantModules = v.InferOutput<typeof TenantModulesSchema>;
