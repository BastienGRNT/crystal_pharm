import type { ModuleName, TenantModules } from '@crystal-pharm/schema';
import type { BookAppointment, ListAvailableSlots } from '../appointment/createBookAppointment';
import type { ModulePropsByName } from '../contract/ModulePropsByName';
import type { SubmitPrescription } from '../prescription/createSubmitPrescription';
import { toAppointmentModuleProps } from './toAppointmentModuleProps';
import { toBrandsModuleProps } from './toBrandsModuleProps';
import { toLoyaltyCardModuleProps } from './toLoyaltyCardModuleProps';
import { toNewsModuleProps } from './toNewsModuleProps';
import { toOnlineOrderModuleProps } from './toOnlineOrderModuleProps';
import { toPrescriptionUploadModuleProps } from './toPrescriptionUploadModuleProps';
import { toServicesModuleProps } from './toServicesModuleProps';
import { toTeamModuleProps } from './toTeamModuleProps';

/** `undefined` pour un module désactivé : il ne sera pas rendu. */
export type EnabledModulesProps = { [Name in ModuleName]: ModulePropsByName[Name] | undefined };

export function toEnabledModulesProps(
  modules: TenantModules,
  context: {
    renderedAt: Date;
    /** La carte de fidélité est celle du groupement : sans groupement, le module reste masqué. */
    belongsToGroup: boolean;
    submitPrescription: SubmitPrescription;
    listAvailableSlots: ListAvailableSlots;
    bookAppointment: BookAppointment;
  },
): EnabledModulesProps {
  return {
    team: modules.team.enabled ? toTeamModuleProps(modules.team.data) : undefined,
    services: modules.services.enabled ? toServicesModuleProps(modules.services.data) : undefined,
    brands: modules.brands.enabled ? toBrandsModuleProps(modules.brands.data) : undefined,
    news: modules.news.enabled ? toNewsModuleProps(modules.news.data) : undefined,
    prescriptionUpload: modules.prescriptionUpload.enabled
      ? toPrescriptionUploadModuleProps(modules.prescriptionUpload.data, context.submitPrescription)
      : undefined,
    appointment: modules.appointment.enabled ? toAppointmentModuleProps(modules.appointment.data, context) : undefined,
    onlineOrder: modules.onlineOrder.enabled ? toOnlineOrderModuleProps(modules.onlineOrder.data) : undefined,
    loyaltyCard: modules.loyaltyCard.enabled && context.belongsToGroup ? toLoyaltyCardModuleProps(modules.loyaltyCard.data) : undefined,
  };
}
