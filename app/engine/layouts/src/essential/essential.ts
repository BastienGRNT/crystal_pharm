import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { essentialSettingsSchema, type EssentialSettings } from './essentialManifest';
import { AppointmentBlock } from './organisms/AppointmentBlock';
import { BrandsBlock } from './organisms/BrandsBlock';
import { DutyHotlineBlock } from './organisms/DutyHotlineBlock';
import { FindUsBlock } from './organisms/FindUsBlock';
import { HeroMasthead } from './organisms/HeroMasthead';
import { LoyaltyCardBlock } from './organisms/LoyaltyCardBlock';
import { NewsBlock } from './organisms/NewsBlock';
import { OnDutyBlock } from './organisms/OnDutyBlock';
import { OnlineOrderBlock } from './organisms/OnlineOrderBlock';
import { OpeningHoursBlock } from './organisms/OpeningHoursBlock';
import { PrescriptionCollapsibleCard } from './organisms/PrescriptionCollapsibleCard';
import { ServicesBlock } from './organisms/ServicesBlock';
import { TeamBlock } from './organisms/TeamBlock';
import './essential.css';

/** Le layout « essential » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const essential: PharmacySiteLayout<EssentialSettings> = {
  settingsSchema: essentialSettingsSchema,
  hero: HeroMasthead,
  findUs: FindUsBlock,
  onDuty: OnDutyBlock,
  openingHours: OpeningHoursBlock,
  team: TeamBlock,
  services: ServicesBlock,
  news: NewsBlock,
  prescriptionUpload: PrescriptionCollapsibleCard,
  loyaltyCard: LoyaltyCardBlock,
  brands: BrandsBlock,
  appointment: AppointmentBlock,
  onlineOrder: OnlineOrderBlock,
  dutyHotline: DutyHotlineBlock,
};
