import type { LoyaltyCardModuleProps } from '../module-props/toLoyaltyCardModuleProps';
import type { NewsModuleProps } from '../module-props/toNewsModuleProps';
import type { OpeningHoursModuleProps } from '../module-props/toOpeningHoursModuleProps';
import type { PrescriptionUploadModuleProps } from '../module-props/toPrescriptionUploadModuleProps';
import type { ServicesModuleProps } from '../module-props/toServicesModuleProps';
import type { TeamModuleProps } from '../module-props/toTeamModuleProps';

/** Les props que reçoit le composant de chaque module. */
export type ModulePropsByName = {
  openingHours: OpeningHoursModuleProps;
  team: TeamModuleProps;
  services: ServicesModuleProps;
  news: NewsModuleProps;
  prescriptionUpload: PrescriptionUploadModuleProps;
  loyaltyCard: LoyaltyCardModuleProps;
};
