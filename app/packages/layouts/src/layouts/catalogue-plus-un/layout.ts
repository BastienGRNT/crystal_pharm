import { defineLayout } from '../../layout';
import PharmacyInfo from './organisms/PharmacyInfo.svelte';
import Hero from './organisms/Hero.svelte';
import Brands from './organisms/Brands.svelte';
import Testimonials from './organisms/Testimonials.svelte';
import Team from './organisms/Team.svelte';

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
