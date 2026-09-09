import { defineLayout } from '../../layout';
import PharmacyInfo from './PharmacyInfo.svelte';
import Hero from './Hero.svelte';
import Brands from './Brands.svelte';
import Testimonials from './Testimonials.svelte';
import Team from './Team.svelte';

// Tous les modules catalogue, plus un module unique (hero).
export const cataloguePlusUn = defineLayout({
	id: 'catalogue-plus-un',
	kind: 'catalogue-complet',
	plus: ['hero'],
	orderable: true,
	sections: {
		pharmacyInfo: PharmacyInfo,
		hero: Hero,
		brands: Brands,
		testimonials: Testimonials,
		team: Team
	}
});
