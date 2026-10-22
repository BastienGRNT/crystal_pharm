import type { TenantModules } from '@crystal-pharm/schema';
import type { ModuleName } from '@crystal-pharm/schema';
import type { ModulePropsByName } from '../contract/ModulePropsByName';
import type { SubmitPrescription } from '../prescription/createSubmitPrescription';
import { toLoyaltyCardModuleProps } from './toLoyaltyCardModuleProps';
import { toNewsModuleProps } from './toNewsModuleProps';
import { toOpeningHoursModuleProps } from './toOpeningHoursModuleProps';
import { toPrescriptionUploadModuleProps } from './toPrescriptionUploadModuleProps';
import { toServicesModuleProps } from './toServicesModuleProps';
import { toTeamModuleProps } from './toTeamModuleProps';

/** `undefined` pour un module désactivé : il ne sera pas rendu. */
export type EnabledModulesProps = { [Name in ModuleName]: ModulePropsByName[Name] | undefined };

export function toEnabledModulesProps(
  modules: TenantModules,
  context: { renderedAt: Date; submitPrescription: SubmitPrescription },
): EnabledModulesProps {
  return {
    openingHours: modules.openingHours.enabled ? toOpeningHoursModuleProps(modules.openingHours.data, context.renderedAt) : undefined,
    team: modules.team.enabled ? toTeamModuleProps(modules.team.data) : undefined,
    services: modules.services.enabled ? toServicesModuleProps(modules.services.data) : undefined,
    news: modules.news.enabled ? toNewsModuleProps(modules.news.data) : undefined,
    prescriptionUpload: modules.prescriptionUpload.enabled
      ? toPrescriptionUploadModuleProps(modules.prescriptionUpload.data, context.submitPrescription)
      : undefined,
    loyaltyCard: modules.loyaltyCard.enabled ? toLoyaltyCardModuleProps(modules.loyaltyCard.data) : undefined,
  };
}
