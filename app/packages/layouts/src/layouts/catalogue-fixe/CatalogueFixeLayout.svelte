<script module lang="ts">
	import { defineLayout } from '../../define-layout';

	// Layout de test : tous les modules catalogue, dans un ordre imposé.
	export const catalogueFixeMeta = defineLayout({
		id: 'catalogue-fixe',
		kind: 'catalogue-complet',
		// `order` fixe l'ordre du layout : le site ne peut plus le changer, et
		// TS exige ici la liste complète de ses modules.
		order: ['pharmacyInfo', 'brands', 'testimonials', 'team']
	});
</script>

<script lang="ts">
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import TeamSection from './organisms/TeamSection.svelte';
	import { orderModules } from '../../module-order';
	import { renderEachModule, type LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout.
	let {
		modules,
		pharmacyInfo,
		brands,
		testimonials,
		team
	}: LayoutProps<typeof catalogueFixeMeta> = $props();

	const orderedModules = $derived(orderModules(catalogueFixeMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived(
		renderEachModule(catalogueFixeMeta, {
			pharmacyInfo: renderPharmacyInfo,
			brands: renderBrands,
			testimonials: renderTestimonials,
			team: renderTeam
		})
	);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection {brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection {testimonials} />{/snippet}
{#snippet renderTeam()}<TeamSection {team} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
