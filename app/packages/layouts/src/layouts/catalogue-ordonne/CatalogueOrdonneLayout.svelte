<script lang="ts">
	import type { Snippet } from 'svelte';
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import TeamSection from './organisms/TeamSection.svelte';
	import { catalogueOrdonneMeta, type CatalogueOrdonneModuleKey, type CatalogueOrdonneSiteData } from './layout.meta';
	import { orderModules } from '../../module-order';

	let { data }: { data: CatalogueOrdonneSiteData } = $props();

	const orderedModules = $derived(orderModules(catalogueOrdonneMeta, data.modules));

	// Record<ModuleKey, Snippet> : oublier une clé ici ne compile pas —
	// garantie qu'aucun module déclaré par ce layout ne peut être oublié
	// au rendu (chaque snippet est déclaré plus bas, dans le markup).
	const sections = $derived({
		pharmacyInfo: renderPharmacyInfo,
		brands: renderBrands,
		testimonials: renderTestimonials,
		team: renderTeam
	} satisfies Record<CatalogueOrdonneModuleKey, Snippet>);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={data.pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection brands={data.brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection testimonials={data.testimonials} />{/snippet}
{#snippet renderTeam()}<TeamSection team={data.team} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
