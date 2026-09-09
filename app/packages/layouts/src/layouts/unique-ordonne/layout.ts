import { defineLayout } from '../../layout';
import PharmacyInfo from './PharmacyInfo.svelte';
import Hero from './Hero.svelte';
import About from './About.svelte';

// Tous les modules unique, que le site peut réordonner.
export const uniqueOrdonne = defineLayout({
	id: 'unique-ordonne',
	kind: 'unique-complet',
	orderable: true,
	sections: {
		pharmacyInfo: PharmacyInfo,
		hero: Hero,
		about: About
	}
});
