import type { HeroSectionData, PharmacyInfo } from '@crystal-pharm/schema';

export type HeroSectionProps = {
  pharmacy: Readonly<PharmacyInfo>;
  /** Absente : le layout affiche son image par défaut. */
  imageUrl?: string;
  /** Absente : le layout affiche son accroche par défaut. */
  headline?: string;
};

export function toHeroSectionProps(pharmacy: PharmacyInfo, data: HeroSectionData): HeroSectionProps {
  return { pharmacy, imageUrl: data.imageUrl, headline: data.headline };
}
