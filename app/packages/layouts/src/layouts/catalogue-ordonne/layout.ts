import { defineLayout } from '../../layout';
import PharmacyInfo from './organisms/PharmacyInfo.svelte';
import Brands from './organisms/Brands.svelte';
import Testimonials from './organisms/Testimonials.svelte';
import Team from './organisms/Team.svelte';

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
