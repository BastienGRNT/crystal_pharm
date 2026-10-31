import type { HeroSectionProps } from './toHeroSectionProps';
import type { FindUsSectionProps } from './toFindUsSectionProps';
import type { OnDutySectionProps } from './toOnDutySectionProps';
import type { OpeningHoursSectionProps } from './toOpeningHoursSectionProps';

/** Les props que reçoit le composant de chaque section fixe. */
export type FixedSectionPropsByName = {
  hero: HeroSectionProps;
  findUs: FindUsSectionProps;
  onDuty: OnDutySectionProps;
  openingHours: OpeningHoursSectionProps;
};

export type FixedSectionName = keyof FixedSectionPropsByName;

const fixedSectionNamesRecord: Record<FixedSectionName, true> = { hero: true, findUs: true, onDuty: true, openingHours: true };

/** Dérivée du type : une section ajoutée à `FixedSectionPropsByName` ne compile pas tant qu'elle n'est pas ici. */
export const fixedSectionNames = Object.keys(fixedSectionNamesRecord) as FixedSectionName[];
