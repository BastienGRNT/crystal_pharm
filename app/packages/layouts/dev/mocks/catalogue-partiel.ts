import type { LayoutProps } from '../../src/define-layout';
import type { cataloguePartielMeta } from '../../src/layouts/catalogue-partiel/CataloguePartielLayout.svelte';

// Simule l'objet que l'API C# renverra pour un site utilisant ce layout.
// "description" est présente dans "brands" mais absente du contrat déclaré
// par le layout : elle ne doit jamais apparaître à l'écran, sans pour
// autant être perdue. Ordre volontairement différent de celui déclaré
// dans `supports` (testimonials avant brands avant pharmacyInfo), pour
// vérifier que c'est bien l'ordre voulu par le site qui est rendu
// (layout orderable: true).
export const mockCataloguePartielSiteData: LayoutProps<typeof cataloguePartielMeta> = {
	modules: [
		{ module: 'testimonials', order: 1 },
		{ module: 'brands', order: 2 },
		{ module: 'pharmacyInfo', order: 3 }
	],
	pharmacyInfo: {
		name: 'Officine Lumière',
		address: '12 rue des Lilas, 69000 Lyon',
		phone: '04 78 00 00 00'
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
	]
};
