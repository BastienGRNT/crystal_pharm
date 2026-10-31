import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { neighborhoodSettingsSchema, type NeighborhoodSettings } from './neighborhoodManifest';
import { AppointmentSection } from './organisms/AppointmentSection';
import { BrandsSection } from './organisms/BrandsSection';
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
import './neighborhood.css';

/** Le layout « neighborhood » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const neighborhood: PharmacySiteLayout<NeighborhoodSettings> = {
  settingsSchema: neighborhoodSettingsSchema,
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
};
