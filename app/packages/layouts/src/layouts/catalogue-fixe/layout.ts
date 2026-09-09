import { defineLayout } from '../../layout';
import PharmacyInfo from './PharmacyInfo.svelte';
import Brands from './Brands.svelte';
import Testimonials from './Testimonials.svelte';
import Team from './Team.svelte';

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
