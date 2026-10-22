// Pour l'application qui sert les sites : rendre, hydrater, et construire les layouts à partir de leurs dossiers.
export { renderTenantSite, type RenderResult } from './renderTenantSite';
export { hydrateTenantSite } from './hydrateTenantSite';
export { createLayoutRegistry, type LayoutRegistry } from './layout-registry/createLayoutRegistry';
export { rendererClientAssetsPath } from './html-document/rendererClientAssetsPath';
/** Pour une future app SolidStart, qui gérerait elle-même le document HTML et l'hydratation. */
export { TenantSiteRoot } from './TenantSiteRoot';

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
