// Pour l'app qui sert les sites : construire la page d'un tenant, avec les layouts découverts dans leurs dossiers.
export { createTenantSitePage, type TenantSitePage } from './createTenantSitePage';
export { createLayoutRegistry, type LayoutRegistry } from './layout-registry/createLayoutRegistry';
export type { SendPrescription } from './prescription/createSubmitPrescription';
export { toPrescriptionFormData } from './prescription/toPrescriptionFormData';

// Pour écrire un layout : le type à respecter, les pages, et les props que reçoit chaque module.
export type { PharmacySiteLayout } from './contract/PharmacySiteLayout';
export { definePage } from './contract/definePage';
export type { LayoutPageProps } from './contract/LayoutPageProps';
export type { Part } from './contract/Part';
export type { EnabledModulesProps } from './module-props/toEnabledModulesProps';
export type { HeroSectionProps } from './section-props/toHeroSectionProps';
export type { FindUsSectionProps } from './section-props/toFindUsSectionProps';
export type { OpeningHoursSectionProps } from './section-props/toOpeningHoursSectionProps';
export type { OnDutySectionProps } from './section-props/toOnDutySectionProps';
export type { OnDutyAnnouncement } from './section-props/computeOnDutyAnnouncement';
export type { FixedSectionName, FixedSectionPropsByName } from './section-props/FixedSectionPropsByName';
export type { TeamModuleProps } from './module-props/toTeamModuleProps';
export type { ServicesModuleProps } from './module-props/toServicesModuleProps';
export type { NewsModuleProps } from './module-props/toNewsModuleProps';
export type { PrescriptionUploadModuleProps } from './module-props/toPrescriptionUploadModuleProps';
export type { LoyaltyCardModuleProps } from './module-props/toLoyaltyCardModuleProps';
export type { BrandsModuleProps } from './module-props/toBrandsModuleProps';
export type { AppointmentModuleProps } from './module-props/toAppointmentModuleProps';
export type { OnlineOrderModuleProps } from './module-props/toOnlineOrderModuleProps';
export type {
  AppointmentForm,
  AppointmentFormErrors,
  AppointmentBookingResult,
  AppointmentActions,
  AppointmentGateway,
  AppointmentOptionsResult,
  AvailableDaysResult,
  AvailableSlotsResult,
  BookAppointment,
} from './appointment/createBookAppointment';
export { onlineOrderStablePath, appointmentStablePath } from './redirect/findStableRedirectLocation';
export type { PrescriptionForm, PrescriptionFormErrors } from './prescription/validatePrescriptionForm';
export type { SubmitPrescription } from './prescription/createSubmitPrescription';
export { createPrescriptionFormState, type PrescriptionFormState, type PrescriptionFormStatus } from './prescription/createPrescriptionFormState';
export {
  createAppointmentWizardState,
  type AppointmentWizardState,
  type AppointmentWizardStep,
  type AppointmentSendStatus,
  type AppointmentLoadStatus,
  type AppointmentOptionsStatus,
  type CalendarDayCell,
  type TimeOfDay,
  type TimeOfDaySlots,
  type TimedSlot,
} from './appointment/createAppointmentWizardState';
export { buildAppointmentCalendarFile } from './appointment/buildAppointmentCalendarFile';
