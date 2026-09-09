import type { BrandsModule } from './modules/brands';

// "description" est présente dans la donnée mockée mais absente du
// contrat de officine-lumiere : elle ne doit jamais apparaître à l'écran
// pour ce layout, sans pour autant être perdue.
export const mockBrands: BrandsModule[] = [
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
];
