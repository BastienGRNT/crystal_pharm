<script lang="ts">
	import type { Snippet } from 'svelte';
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import { cataloguePartielMeta, type CataloguePartielModuleKey, type CataloguePartielSiteData } from './layout.meta';
	import { orderModules } from '../../module-order';
	import { pickFields } from '../../pick-fields';

	// Reçoit la donnée telle que l'API la renverra (cf. CataloguePartielSiteData)
	// et génère la page : ordre des modules + filtrage des champs, tous deux
	// pilotés par `cataloguePartielMeta`, jamais par l'appelant.
	let { data }: { data: CataloguePartielSiteData } = $props();

	const orderedModules = $derived(orderModules(cataloguePartielMeta, data.modules));
	const brands = $derived(data.brands.map((b) => pickFields(b, cataloguePartielMeta.supports.brands)));

	// Record<ModuleKey, Snippet> : oublier une clé ici ne compile pas —
	// garantie qu'aucun module déclaré par ce layout ne peut être oublié
	// au rendu (chaque snippet est déclaré plus bas, dans le markup).
	const sections = $derived({
		pharmacyInfo: renderPharmacyInfo,
		brands: renderBrands,
		testimonials: renderTestimonials
	} satisfies Record<CataloguePartielModuleKey, Snippet>);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={data.pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection {brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection testimonials={data.testimonials} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
