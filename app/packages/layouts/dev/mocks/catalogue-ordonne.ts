import type { LayoutProps } from '../../src/define-layout';
import type { catalogueOrdonneMeta } from '../../src/layouts/catalogue-ordonne/CatalogueOrdonneLayout.svelte';

// Ordre volontairement différent de celui déclaré dans `supports`
// (pharmacyInfo, brands, testimonials, team), pour vérifier que l'ordre
// voulu par le site est bien rendu (layout orderable: true).
export const mockCatalogueOrdonneSiteData: LayoutProps<typeof catalogueOrdonneMeta> = {
	modules: [
		{ module: 'team', order: 1 },
		{ module: 'testimonials', order: 2 },
		{ module: 'brands', order: 3 },
		{ module: 'pharmacyInfo', order: 4 }
	],
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
		{ author: 'Claire M.', quote: 'Accueil chaleureux, conseils précis.' },
		{ author: 'Marc D.', quote: 'Toujours de bons conseils sur mes traitements.' }
	],
	team: [
		{ name: 'Claire Dupont', role: 'Pharmacienne titulaire', photoUrl: 'https://placehold.co/64x64?text=CD' },
		{ name: 'Karim Haddad', role: 'Préparateur', photoUrl: 'https://placehold.co/64x64?text=KH' }
	]
};
