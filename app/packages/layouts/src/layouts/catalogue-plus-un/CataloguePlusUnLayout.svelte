<script module lang="ts">
	import { defineLayout } from '../../define-layout';

	// Layout de test : tous les modules catalogue + un module unique.
	export const cataloguePlusUnMeta = defineLayout({
		id: 'catalogue-plus-un',
		kind: 'catalogue-complet',
		// Seul l'ajout hors famille se déclare : le catalogue vient du genre.
		plus: ['hero']
	});
</script>

<script lang="ts">
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import TeamSection from './organisms/TeamSection.svelte';
	import HeroSection from './organisms/HeroSection.svelte';
	import { orderModules } from '../../module-order';
	import { renderEachModule, type LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout.
	let {
		modules,
		pharmacyInfo,
		brands,
		testimonials,
		team,
		hero,
	}: LayoutProps<typeof cataloguePlusUnMeta> = $props();

	const orderedModules = $derived(orderModules(cataloguePlusUnMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived(
		renderEachModule(cataloguePlusUnMeta, {
			pharmacyInfo: renderPharmacyInfo,
			brands: renderBrands,
			testimonials: renderTestimonials,
			team: renderTeam,
			hero: renderHero,
		})
	);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection {brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection {testimonials} />{/snippet}
{#snippet renderTeam()}<TeamSection {team} />{/snippet}
{#snippet renderHero()}<HeroSection {hero} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
