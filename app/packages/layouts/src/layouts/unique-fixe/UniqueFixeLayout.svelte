<script module lang="ts">
	import { defineLayout } from '../../define-layout';

	// Layout de test : tous les modules unique, dans un ordre imposé.
	export const uniqueFixeMeta = defineLayout({
		id: 'unique-fixe',
		kind: 'unique-complet',
		order: ['pharmacyInfo', 'hero', 'about']
	});
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import HeroSection from './organisms/HeroSection.svelte';
	import AboutSection from './organisms/AboutSection.svelte';
	import { orderModules } from '../../module-order';
	import type { LayoutKey, LayoutProps } from '../../define-layout';

	// Une prop par module garanti par le genre : en oublier une souligne la
	// balise d'appel du layout.
	let {
		modules,
		pharmacyInfo,
		hero,
		about,
	}: LayoutProps<typeof uniqueFixeMeta> = $props();

	const orderedModules = $derived(orderModules(uniqueFixeMeta, modules));

	// Oublier une clé ici ne compile pas : aucun module déclaré par ce
	// layout ne peut être absent du rendu.
	const sections = $derived({
		pharmacyInfo: renderPharmacyInfo,
		hero: renderHero,
		about: renderAbout,
	} satisfies Record<LayoutKey<typeof uniqueFixeMeta>, Snippet>);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={pharmacyInfo} />{/snippet}
{#snippet renderHero()}<HeroSection {hero} />{/snippet}
{#snippet renderAbout()}<AboutSection {about} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
