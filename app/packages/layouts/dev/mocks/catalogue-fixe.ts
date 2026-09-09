import type { CatalogueFixeSiteData } from '../../src/layouts/catalogue-fixe/layout.meta';

// L'ordre demandé par le site (`modules`) est volontairement mélangé pour
// vérifier qu'il est bien IGNORÉ : layout orderable: false, donc le rendu
// doit suivre l'ordre canonique de `supports` (pharmacyInfo, brands,
// testimonials, team), quel que soit l'ordre ci-dessous.
export const mockCatalogueFixeSiteData: CatalogueFixeSiteData = {
	modules: [
		{ module: 'team', order: 1 },
		{ module: 'testimonials', order: 2 },
		{ module: 'brands', order: 3 },
		{ module: 'pharmacyInfo', order: 4 }
	],
	pharmacyInfo: {
		name: 'Grande Pharmacie de la Gare',
		address: '2 avenue de la Gare, 33000 Bordeaux',
		phone: '05 56 00 00 00'
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
		{ author: 'Sophie L.', quote: 'Rapide et efficace, personnel très professionnel.' },
		{ author: 'Yannick B.', quote: 'Large choix de produits, bons conseils.' }
	],
	team: [
		{ name: 'Nadia Ferreira', role: 'Pharmacienne titulaire', photoUrl: 'https://placehold.co/64x64?text=NF' },
		{ name: 'Tom Lefebvre', role: 'Préparateur', photoUrl: 'https://placehold.co/64x64?text=TL' }
	]
};
