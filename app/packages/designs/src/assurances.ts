import type { SectionName } from './sections/registry';

/**
 * Les promesses faites au pharmacien. Lire ce fichier, c'est savoir exactement
 * ce que chaque gamme garantit — il n'y a pas d'autre endroit où le chercher.
 *
 * - `complete`  : il aura tout. Il choisit à l'esthétique, sans réfléchir.
 * - `signature` : design libre, on ne garantit que l'essentiel de l'officine.
 * - `custom`    : sur-mesure pour une pharmacie ou un groupement. Aucune
 *                 promesse, pas même l'essentiel, et accès restreint.
 *
 * Ajouter une section ici casse tous les designs de la gamme concernée, en
 * nommant la section manquante. C'est voulu : c'est le jour où la promesse change.
 */
export const ASSURANCES = {
	complete: [
		'pharmacyInfo',
		'openingHours',
		'services',
		'brands',
		'team',
		'testimonials'
	],
	signature: ['pharmacyInfo', 'openingHours'],
	custom: []
} as const satisfies Record<string, readonly SectionName[]>;

export type Assurance = keyof typeof ASSURANCES;

/** Les sections qu'une gamme garantit. `never` pour `custom`, qui ne promet rien. */
export type PromisedBy<A extends Assurance> = (typeof ASSURANCES)[A][number];

export const ASSURANCE_LABELS: Record<Assurance, string> = {
	complete: 'Complet',
	signature: 'Signature',
	custom: 'Sur-mesure'
};

export const ASSURANCE_PROMISES: Record<Assurance, string> = {
	complete: 'Contient toutes les sections essentielles, quel que soit le design choisi.',
	signature: 'Design libre. Seules les informations de la pharmacie sont garanties.',
	custom: 'Réalisé pour une pharmacie ou un groupement. Aucune section garantie.'
};
