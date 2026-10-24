// Pour l'app qui sert les sites : construire la page d'un tenant, avec les layouts découverts dans leurs dossiers.
export { createTenantSitePage, type TenantSitePage } from './createTenantSitePage';
export { createLayoutRegistry, type LayoutRegistry } from './layout-registry/createLayoutRegistry';
export type { SendPrescription } from './prescription/createSubmitPrescription';

// Pour écrire un layout : le type à respecter, les pages, et les props que reçoit chaque module.
export type { PharmacySiteLayout } from './contract/PharmacySiteLayout';
export { definePage } from './contract/definePage';
export type { LayoutPageProps } from './contract/LayoutPageProps';
export type { Part } from './contract/Part';
export type { EnabledModulesProps } from './module-props/toEnabledModulesProps';
export type { OpeningHoursModuleProps } from './module-props/toOpeningHoursModuleProps';
export type { OnDutyAnnouncement } from './module-props/computeOnDutyAnnouncement';
export type { TeamModuleProps } from './module-props/toTeamModuleProps';
export type { ServicesModuleProps } from './module-props/toServicesModuleProps';
export type { NewsModuleProps } from './module-props/toNewsModuleProps';
export type { PrescriptionUploadModuleProps } from './module-props/toPrescriptionUploadModuleProps';
export type { LoyaltyCardModuleProps } from './module-props/toLoyaltyCardModuleProps';
export type { PrescriptionForm, PrescriptionFormErrors } from './prescription/validatePrescriptionForm';
export type { SubmitPrescription } from './prescription/createSubmitPrescription';
