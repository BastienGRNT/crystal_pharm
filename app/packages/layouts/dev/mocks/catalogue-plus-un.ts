import type { LayoutProps } from '../../src/define-layout';
import type { cataloguePlusUnMeta } from '../../src/layouts/catalogue-plus-un/CataloguePlusUnLayout.svelte';

// hero est placé au milieu de l'ordre demandé par le site, pour vérifier
// qu'un module unique se réordonne exactement comme un module catalogue
// (layout orderable: true — l'ordre voulu par le site est rendu tel quel).
export const mockCataloguePlusUnSiteData: LayoutProps<typeof cataloguePlusUnMeta> = {
	modules: [
		{ module: 'testimonials', order: 1 },
		{ module: 'hero', order: 2 },
		{ module: 'brands', order: 3 },
		{ module: 'team', order: 4 },
		{ module: 'pharmacyInfo', order: 5 }
	],
	pharmacyInfo: {
		name: 'Pharmacie des Halles',
		address: '18 rue du Marché, 44000 Nantes',
		phone: '02 40 00 00 00'
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
		{ author: 'Julie R.', quote: 'Équipe à l’écoute, jamais déçue.' },
		{ author: 'Pierre A.', quote: 'Pharmacie de quartier au top.' }
	],
	team: [
		{ name: 'Hélène Rocher', role: 'Pharmacienne titulaire', photoUrl: 'https://placehold.co/64x64?text=HR' },
		{ name: 'Amine Cherif', role: 'Préparateur', photoUrl: 'https://placehold.co/64x64?text=AC' }
	],
	hero: {
		title: 'Votre pharmacie de quartier',
		subtitle: 'Conseils personnalisés, du lundi au samedi.',
		imageUrl: 'https://placehold.co/800x300?text=Hero'
	}
};
