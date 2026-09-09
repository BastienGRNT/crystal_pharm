import { defineLayout } from '../../layout';
import PharmacyInfo from './organisms/PharmacyInfo.svelte';
import Brands from './organisms/Brands.svelte';
import Testimonials from './organisms/Testimonials.svelte';
import Team from './organisms/Team.svelte';

// Tous les modules catalogue, dans l'ordre imposé ci-dessous.
export const catalogueFixe = defineLayout({
	id: 'catalogue-fixe',
	kind: 'catalogue-complet',
	orderable: false,
	sections: {
		pharmacyInfo: PharmacyInfo,
		brands: Brands,
		testimonials: Testimonials,
		team: Team
	}
});
