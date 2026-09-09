import { ASSURANCE_LABELS, ASSURANCE_PROMISES, ASSURANCES, type Assurance } from './assurances';
import { DESIGNS, type Design } from './designs';
import type { SectionName } from './sections/registry';
import { isDesignAllowed } from './site';

/** Le nom de chaque section tel que le pharmacien la connaît. */
export const SECTION_LABELS: Record<SectionName, string> = {
	pharmacyInfo: 'Informations de la pharmacie',
	hero: 'Bannière d’accueil',
	openingHours: 'Horaires d’ouverture',
	about: 'Présentation',
	services: 'Services',
	brands: 'Marques distribuées',
	team: 'Équipe',
	testimonials: 'Avis clients'
};

/**
 * Ce que le manager montre au pharmacien. `assurance` dit ce qui est **promis**,
 * et rien ici n'est saisi à la main : la gamme est lue dans le design, et la
 * promesse dans `assurances.ts`.
 */
export type DesignCard = {
	readonly id: string;
	readonly name: string;
	readonly assurance: Assurance;
	readonly assuranceLabel: string;
	readonly promise: string;
	readonly reorderable: boolean;
	readonly promisedSections: readonly SectionName[];
};

export function toCard(design: Design): DesignCard {
	const { assurance, name, reorderable } = design.declaration;
	return {
		id: design.id,
		name,
		assurance,
		assuranceLabel: ASSURANCE_LABELS[assurance],
		promise: ASSURANCE_PROMISES[assurance],
		reorderable,
		promisedSections: ASSURANCES[assurance]
	};
}

/** Les designs qu'un tenant a le droit de choisir. */
export function catalogueFor(tenant: string): DesignCard[] {
	return DESIGNS.filter((design) => isDesignAllowed(design.declaration, tenant)).map(toCard);
}
