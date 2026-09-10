import { parseAbout } from './about';
import { parseBrands } from './brands';
import { parseHero } from './hero';
import { parseOpeningHours } from './opening-hours';
import { parsePharmacyInfo } from './pharmacy-info';
import { parseServices } from './services';
import { parseTeam } from './team';
import { parseTestimonials } from './testimonials';

/**
 * Le sceau de la frontière.
 *
 * `sealed` n'est exporté nulle part et `seal` non plus : ce fichier est le
 * seul du dépôt capable de produire du contenu scellé. Un design n'a donc
 * aucun import à s'interdire — il n'existe rien à importer. C'est ce qui
 * remplace le garde-fou qu'un outil externe devait faire respecter.
 */
declare const sealed: unique symbol;

type Trusted<T> = T & { readonly [sealed]: 'content' };

/** Enveloppe un analyseur : ce qui sort de la frontière en ressort scellé. */
function sealing<T>(parse: (raw: unknown) => T | null) {
	return (raw: unknown): Trusted<T> | null => {
		const value = parse(raw);
		return value === null ? null : (value as Trusted<T>);
	};
}

/**
 * Toutes les sections du produit. L'ordre d'écriture n'a pas de rôle ici :
 * l'ordre d'affichage est celui des snippets dans le `Page.svelte` du design.
 *
 * Ajouter une section au produit = une ligne ici, plus son analyseur. Ça ne
 * casse aucun design. Ça ne devient une promesse que le jour où on l'ajoute à
 * `assurances.ts`.
 */
export const SECTIONS = {
	pharmacyInfo: sealing(parsePharmacyInfo),
	hero: sealing(parseHero),
	openingHours: sealing(parseOpeningHours),
	about: sealing(parseAbout),
	services: sealing(parseServices),
	brands: sealing(parseBrands),
	team: sealing(parseTeam),
	testimonials: sealing(parseTestimonials)
} as const;

export type SectionName = keyof typeof SECTIONS;

/** Le contenu scellé d'une section, déduit de son analyseur. */
export type SectionContent<N extends SectionName> = NonNullable<ReturnType<(typeof SECTIONS)[N]>>;

export const SECTION_NAMES = Object.keys(SECTIONS) as SectionName[];

export function isSectionName(value: unknown): value is SectionName {
	return typeof value === 'string' && value in SECTIONS;
}
