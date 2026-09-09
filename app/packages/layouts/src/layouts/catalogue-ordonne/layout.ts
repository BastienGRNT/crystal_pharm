import { defineLayout } from '../../layout';
import PharmacyInfo from './PharmacyInfo.svelte';
import Brands from './Brands.svelte';
import Testimonials from './Testimonials.svelte';
import Team from './Team.svelte';

// Tous les modules catalogue, que le site peut réordonner.
export const catalogueOrdonne = defineLayout({
	id: 'catalogue-ordonne',
	kind: 'catalogue-complet',
	orderable: true,
	sections: {
		pharmacyInfo: PharmacyInfo,
		brands: Brands,
		testimonials: Testimonials,
		team: Team
	}
});
