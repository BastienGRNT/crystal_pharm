import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { clearSettingsSchema, type ClearSettings } from './clearManifest';
import { AppointmentSection } from './organisms/AppointmentSection';
import { BrandsSection } from './organisms/BrandsSection';
import { DutyHotlineSection } from './organisms/DutyHotlineSection';
import { FindUsSection } from './organisms/FindUsSection';
import { HeroSection } from './organisms/HeroSection';
import { LoyaltyCardSection } from './organisms/LoyaltyCardSection';
import { NewsSection } from './organisms/NewsSection';
import { OnDutySection } from './organisms/OnDutySection';
import { OnlineOrderSection } from './organisms/OnlineOrderSection';
import { OpeningHoursSection } from './organisms/OpeningHoursSection';
import { PrescriptionSection } from './organisms/PrescriptionSection';
import { ServicesSection } from './organisms/ServicesSection';
import { TeamSection } from './organisms/TeamSection';
import './clear.css';

/** Le layout « clear » (Clair) : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const clear: PharmacySiteLayout<ClearSettings> = {
  settingsSchema: clearSettingsSchema,
  hero: HeroSection,
  findUs: FindUsSection,
  onDuty: OnDutySection,
  openingHours: OpeningHoursSection,
  team: TeamSection,
  services: ServicesSection,
  news: NewsSection,
  prescriptionUpload: PrescriptionSection,
  loyaltyCard: LoyaltyCardSection,
  brands: BrandsSection,
  appointment: AppointmentSection,
  onlineOrder: OnlineOrderSection,
  dutyHotline: DutyHotlineSection,
};
