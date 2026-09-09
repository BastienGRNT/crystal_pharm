<script module lang="ts">
	import { defineLayout } from '../../define-layout';

	// Le layout se déclare lui-même : plus de fichier de config à côté.
	export const catalogueOrdonneMeta = defineLayout({
		id: 'catalogue-ordonne',
		kind: 'catalogue-complet'
	});
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import TeamSection from './organisms/TeamSection.svelte';
	import { orderModules } from '../../module-order';
	import type { LayoutKey, LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout, pas une ligne perdue dans un objet de data.
	let {
		modules,
		pharmacyInfo,
		brands,
		testimonials,
		team
	}: LayoutProps<typeof catalogueOrdonneMeta> = $props();

	const orderedModules = $derived(orderModules(catalogueOrdonneMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived({
		pharmacyInfo: renderPharmacyInfo,
		brands: renderBrands,
		testimonials: renderTestimonials,
		team: renderTeam
	} satisfies Record<LayoutKey<typeof catalogueOrdonneMeta>, Snippet>);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection {brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection {testimonials} />{/snippet}
{#snippet renderTeam()}<TeamSection {team} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
