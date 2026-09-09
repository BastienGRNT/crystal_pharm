import type { ActiveModule, LayoutData, LayoutKey } from '../../src/layout';
import type { catalogueFixe } from '../../src/layouts/catalogue-fixe/layout';

// Ce que le site a activé, dans l'ordre qu'il veut. Volontairement
// différent de l'ordre du layout, pour voir l'effet de `orderable`.
export const catalogueFixeActive: readonly ActiveModule<LayoutKey<typeof catalogueFixe>>[] = [
	{ module: 'team', order: 1 },
	{ module: 'testimonials', order: 2 },
	{ module: 'brands', order: 3 },
	{ module: 'pharmacyInfo', order: 4 }
];

// La donnée du site : une clé par module du layout, toutes requises.
export const catalogueFixeData: LayoutData<typeof catalogueFixe> = {
	pharmacyInfo: {
		name: 'Grande Pharmacie de la Gare',
		address: '2 avenue de la Gare, 33000 Bordeaux',
		phone: '05 56 00 00 00'
	},
	brands: [
		{
			name: 'Avène',
			logoUrl: 'https://placehold.co/96x96?text=Avène',
			description: 'Peaux sensibles et réactives.'
		},
		{
			name: 'La Roche-Posay',
			logoUrl: 'https://placehold.co/96x96?text=La+Roche-Posay',
			description: 'Dermatologie au quotidien.'
		}
	],
	testimonials: [
		{ author: 'Sophie L.', quote: "Rapide et efficace, personnel très professionnel." },
		{ author: 'Yannick B.', quote: "Large choix de produits, bons conseils." }
	],
	team: [
		{
			name: 'Nadia Ferreira',
			role: 'Pharmacienne titulaire',
			photoUrl: 'https://placehold.co/64x64?text=NF'
		},
		{
			name: 'Tom Lefebvre',
			role: 'Préparateur',
			photoUrl: 'https://placehold.co/64x64?text=TL'
		}
	]
};
