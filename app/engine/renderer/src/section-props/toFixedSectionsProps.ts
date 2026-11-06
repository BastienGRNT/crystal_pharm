import type { FixedSections, PharmacyInfo } from '@crystal-pharm/schema';
import type { FixedSectionPropsByName } from './FixedSectionPropsByName';
import { toFindUsSectionProps } from './toFindUsSectionProps';
import { toHeroSectionProps } from './toHeroSectionProps';
import { toOnDutySectionProps } from './toOnDutySectionProps';
import { toOpeningHoursSectionProps } from './toOpeningHoursSectionProps';

export function toFixedSectionsProps(fixedSections: FixedSections, pharmacy: PharmacyInfo, renderedAt: Date): FixedSectionPropsByName {
  return {
    hero: toHeroSectionProps(pharmacy, fixedSections.hero),
    findUs: toFindUsSectionProps(pharmacy, fixedSections.findUs),
    onDuty: toOnDutySectionProps(fixedSections.openingHours, renderedAt),
    openingHours: toOpeningHoursSectionProps(fixedSections.openingHours, renderedAt),
  };
}
