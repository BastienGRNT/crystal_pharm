<script module lang="ts">
	import { defineLayout } from '../../define-layout';

	// Layout de test : tous les modules unique, réordonnables par le site.
	export const uniqueOrdonneMeta = defineLayout({
		id: 'unique-ordonne',
		kind: 'unique-complet'
	});
</script>

<script lang="ts">
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import HeroSection from './organisms/HeroSection.svelte';
	import AboutSection from './organisms/AboutSection.svelte';
	import { orderModules } from '../../module-order';
	import { renderEachModule, type LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout.
	let {
		modules,
		pharmacyInfo,
		hero,
		about,
	}: LayoutProps<typeof uniqueOrdonneMeta> = $props();

	const orderedModules = $derived(orderModules(uniqueOrdonneMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived(
		renderEachModule(uniqueOrdonneMeta, {
			pharmacyInfo: renderPharmacyInfo,
			hero: renderHero,
			about: renderAbout,
		})
	);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderHero()}<HeroSection {hero} />{/snippet}
{#snippet renderAbout()}<AboutSection {about} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
