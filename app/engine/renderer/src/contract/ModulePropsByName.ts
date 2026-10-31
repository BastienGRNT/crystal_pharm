import type { AppointmentModuleProps } from '../module-props/toAppointmentModuleProps';
import type { BrandsModuleProps } from '../module-props/toBrandsModuleProps';
import type { LoyaltyCardModuleProps } from '../module-props/toLoyaltyCardModuleProps';
import type { NewsModuleProps } from '../module-props/toNewsModuleProps';
import type { OnlineOrderModuleProps } from '../module-props/toOnlineOrderModuleProps';
import type { PrescriptionUploadModuleProps } from '../module-props/toPrescriptionUploadModuleProps';
import type { ServicesModuleProps } from '../module-props/toServicesModuleProps';
import type { TeamModuleProps } from '../module-props/toTeamModuleProps';

/** Les props que reçoit le composant de chaque module. */
export type ModulePropsByName = {
  team: TeamModuleProps;
  services: ServicesModuleProps;
  brands: BrandsModuleProps;
  news: NewsModuleProps;
  prescriptionUpload: PrescriptionUploadModuleProps;
  appointment: AppointmentModuleProps;
  onlineOrder: OnlineOrderModuleProps;
  loyaltyCard: LoyaltyCardModuleProps;
};
