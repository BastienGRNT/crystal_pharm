import type { ActiveModule, LayoutData, LayoutKey } from '../../src/layout';
import type { cataloguePlusUn } from '../../src/layouts/catalogue-plus-un/layout';

// Ce que le site a activé, dans l'ordre qu'il veut. Volontairement
// différent de l'ordre du layout, pour voir l'effet de `orderable`.
export const cataloguePlusUnActive: readonly ActiveModule<LayoutKey<typeof cataloguePlusUn>>[] = [
	{ module: 'testimonials', order: 1 },
	{ module: 'hero', order: 2 },
	{ module: 'brands', order: 3 },
	{ module: 'team', order: 4 },
	{ module: 'pharmacyInfo', order: 5 }
];

// La donnée du site : une clé par module du layout, toutes requises.
export const cataloguePlusUnData: LayoutData<typeof cataloguePlusUn> = {
	pharmacyInfo: {
		name: 'Pharmacie des Halles',
		address: '18 rue du Marché, 44000 Nantes',
		phone: '02 40 00 00 00'
	},
	brands: [
		{
			name: 'Nuxe',
			logoUrl: 'https://placehold.co/96x96?text=Nuxe',
			description: 'Soins naturels et huiles sèches.'
		},
		{
			name: 'Caudalie',
			logoUrl: 'https://placehold.co/96x96?text=Caudalie',
			description: 'Vinothérapie et anti-âge.'
		}
	],
	testimonials: [
		{ author: 'Julie R.', quote: "Équipe à l'écoute, jamais déçue." },
		{ author: 'Pierre A.', quote: "Pharmacie de quartier au top." }
	],
	team: [
		{
			name: 'Hélène Rocher',
			role: 'Pharmacienne titulaire',
			photoUrl: 'https://placehold.co/64x64?text=HR'
		},
		{
			name: 'Amine Cherif',
			role: 'Préparateur',
			photoUrl: 'https://placehold.co/64x64?text=AC'
		}
	],
	hero: {
		title: 'Votre pharmacie de quartier',
		subtitle: 'Conseils personnalisés, du lundi au samedi.',
		imageUrl: 'https://placehold.co/240x120?text=Hero'
	}
};
