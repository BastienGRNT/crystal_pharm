import * as v from 'valibot';
import { createToggleableModuleSchema } from './createToggleableModuleSchema';
import { AppointmentModuleDataSchema } from './AppointmentModuleDataSchema';
import { BrandsModuleDataSchema } from './BrandsModuleDataSchema';
import { LoyaltyCardModuleDataSchema } from './LoyaltyCardModuleDataSchema';
import type { ModuleName } from './ModuleNameSchema';
import { NewsModuleDataSchema } from './NewsModuleDataSchema';
import { OnlineOrderModuleDataSchema } from './OnlineOrderModuleDataSchema';
import { PrescriptionUploadModuleDataSchema } from './PrescriptionUploadModuleDataSchema';
import { ServicesModuleDataSchema } from './ServicesModuleDataSchema';
import { TeamModuleDataSchema } from './TeamModuleDataSchema';

export const TenantModulesSchema = v.object({
  team: createToggleableModuleSchema(TeamModuleDataSchema),
  services: createToggleableModuleSchema(ServicesModuleDataSchema),
  news: createToggleableModuleSchema(NewsModuleDataSchema),
  prescriptionUpload: createToggleableModuleSchema(PrescriptionUploadModuleDataSchema),
  loyaltyCard: createToggleableModuleSchema(LoyaltyCardModuleDataSchema),
  brands: createToggleableModuleSchema(BrandsModuleDataSchema),
  appointment: createToggleableModuleSchema(AppointmentModuleDataSchema),
  onlineOrder: createToggleableModuleSchema(OnlineOrderModuleDataSchema),
} satisfies Record<ModuleName, v.GenericSchema>);

export type TenantModules = v.InferOutput<typeof TenantModulesSchema>;
