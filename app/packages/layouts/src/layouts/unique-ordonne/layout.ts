import { defineLayout } from '../../layout';
import PharmacyInfo from './organisms/PharmacyInfo.svelte';
import Hero from './organisms/Hero.svelte';
import About from './organisms/About.svelte';

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
