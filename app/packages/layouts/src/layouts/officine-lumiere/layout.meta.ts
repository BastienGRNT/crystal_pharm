import type { LayoutMeta } from '../../layout-module-contracts';
import type { BrandsField } from '../../modules/brands';

export const officineLumiereMeta: LayoutMeta<'brands', BrandsField> = {
	id: 'officine-lumiere',
	orderable: true,
	// Sous-ensemble volontaire : ce layout n'affiche pas "description",
	// mais la donnée reste saisissable et conservée (cf. CLAUDE.md).
	supports: {
		brands: { fields: ['name', 'logoUrl'] }
	}
};
