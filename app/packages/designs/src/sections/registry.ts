import { parseAbout } from './about';
import { parseBrands } from './brands';
import { parseHero } from './hero';
import { parseOpeningHours } from './opening-hours';
import { parsePharmacyInfo } from './pharmacy-info';
import { parseServices } from './services';
import { parseTeam } from './team';
import { parseTestimonials } from './testimonials';

/**
 * Toutes les sections du produit. L'ordre d'écriture est l'ordre d'affichage
 * par défaut d'un site : c'est le seul endroit où cet ordre existe.
 *
 * Ajouter une section au produit = une ligne ici. Ça ne casse aucun design.
 * Ça n'en devient une promesse que le jour où on l'ajoute à `assurances.ts`.
 */
export const SECTIONS = {
	pharmacyInfo: parsePharmacyInfo,
	hero: parseHero,
	openingHours: parseOpeningHours,
	about: parseAbout,
	services: parseServices,
	brands: parseBrands,
	team: parseTeam,
	testimonials: parseTestimonials
} as const;

export type SectionName = keyof typeof SECTIONS;

/** Le contenu scellé d'une section, déduit de son analyseur. */
export type SectionContent<N extends SectionName> = NonNullable<ReturnType<(typeof SECTIONS)[N]>>;

export const SECTION_NAMES = Object.keys(SECTIONS) as SectionName[];

export function isSectionName(value: unknown): value is SectionName {
	return typeof value === 'string' && value in SECTIONS;
}
