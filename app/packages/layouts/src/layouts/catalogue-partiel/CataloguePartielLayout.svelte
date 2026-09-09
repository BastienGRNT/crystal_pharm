<script module lang="ts">
	import { definePartialLayout } from '../../define-layout';

	// Layout de test : sous-ensemble de modules ET de champs.
	export const cataloguePartielMeta = definePartialLayout({
		id: 'catalogue-partiel',
		// La liste des modules est la seule vraie information d'un layout
		// partiel. `pharmacyInfo` reste implicite, comme partout ailleurs.
		// "description" n'est pas affiché ici, mais la donnée reste saisissable
		// et conservée (cf. CLAUDE.md).
		modules: { brands: ['name', 'logoUrl'], testimonials: true }
	});
</script>

<script lang="ts">
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import BrandsSection from './organisms/BrandsSection.svelte';
	import TestimonialsSection from './organisms/TestimonialsSection.svelte';
	import { orderModules } from '../../module-order';
	import { renderEachModule, type LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout.
	let {
		modules,
		pharmacyInfo,
		brands,
		testimonials,
	}: LayoutProps<typeof cataloguePartielMeta> = $props();

	const orderedModules = $derived(orderModules(cataloguePartielMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived(
		renderEachModule(cataloguePartielMeta, {
			pharmacyInfo: renderPharmacyInfo,
			brands: renderBrands,
			testimonials: renderTestimonials,
		})
	);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderBrands()}<BrandsSection {brands} />{/snippet}
{#snippet renderTestimonials()}<TestimonialsSection {testimonials} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
