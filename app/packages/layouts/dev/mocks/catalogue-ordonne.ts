import type { ActiveModule, LayoutData, LayoutKey } from '../../src/layout';
import type { catalogueOrdonne } from '../../src/layouts/catalogue-ordonne/layout';

// Ce que le site a activé, dans l'ordre qu'il veut. Volontairement
// différent de l'ordre du layout, pour voir l'effet de `orderable`.
export const catalogueOrdonneActive: readonly ActiveModule<LayoutKey<typeof catalogueOrdonne>>[] = [
	{ module: 'team', order: 1 },
	{ module: 'testimonials', order: 2 },
	{ module: 'brands', order: 3 },
	{ module: 'pharmacyInfo', order: 4 }
];

// La donnée du site : une clé par module du layout, toutes requises.
export const catalogueOrdonneData: LayoutData<typeof catalogueOrdonne> = {
	pharmacyInfo: {
		name: 'Pharmacie du Centre',
		address: '5 place de la Mairie, 74000 Annecy',
		phone: '04 50 00 00 00'
	},
	brands: [
		{
			name: 'Bioderma',
			logoUrl: 'https://placehold.co/96x96?text=Bioderma',
			description: 'Dermo-cosmétique, gamme sensible.'
		},
		{
			name: 'Uriage',
			logoUrl: 'https://placehold.co/96x96?text=Uriage',
			description: 'Eau thermale, soins hydratants.'
		}
	],
	testimonials: [
		{ author: 'Claire M.', quote: "Accueil chaleureux, conseils précis." },
		{ author: 'Marc D.', quote: "Toujours de bons conseils sur mes traitements." }
	],
	team: [
		{
			name: 'Claire Dupont',
			role: 'Pharmacienne titulaire',
			photoUrl: 'https://placehold.co/64x64?text=CD'
		},
		{
			name: 'Karim Haddad',
			role: 'Préparateur',
			photoUrl: 'https://placehold.co/64x64?text=KH'
		}
	]
};
