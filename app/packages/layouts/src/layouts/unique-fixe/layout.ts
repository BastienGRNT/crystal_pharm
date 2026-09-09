import { defineLayout } from '../../layout';
import PharmacyInfo from './PharmacyInfo.svelte';
import Hero from './Hero.svelte';
import About from './About.svelte';

// Tous les modules unique, dans l'ordre imposé ci-dessous.
export const uniqueFixe = defineLayout({
	id: 'unique-fixe',
	kind: 'unique-complet',
	orderable: false,
	sections: {
		pharmacyInfo: PharmacyInfo,
		hero: Hero,
		about: About
	}
});
