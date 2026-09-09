<script lang="ts">
	import type { Snippet } from 'svelte';
	import PharmacyInfoSection from './organisms/PharmacyInfoSection.svelte';
	import HeroSection from './organisms/HeroSection.svelte';
	import AboutSection from './organisms/AboutSection.svelte';
	import { uniqueOrdonneMeta, type UniqueOrdonneModuleKey, type UniqueOrdonneSiteData } from './layout.meta';
	import { orderModules } from '../../module-order';

	let { data }: { data: UniqueOrdonneSiteData } = $props();

	const orderedModules = $derived(orderModules(uniqueOrdonneMeta, data.modules));

	// Record<ModuleKey, Snippet> : oublier une clé ici ne compile pas —
	// garantie qu'aucun module déclaré par ce layout ne peut être oublié
	// au rendu (chaque snippet est déclaré plus bas, dans le markup).
	const sections = $derived({
		pharmacyInfo: renderPharmacyInfo,
		hero: renderHero,
		about: renderAbout
	} satisfies Record<UniqueOrdonneModuleKey, Snippet>);
</script>

{#snippet renderPharmacyInfo()}<PharmacyInfoSection info={data.pharmacyInfo} />{/snippet}
{#snippet renderHero()}<HeroSection hero={data.hero} />{/snippet}
{#snippet renderAbout()}<AboutSection about={data.about} />{/snippet}

{#each orderedModules as moduleKey}
	{@render sections[moduleKey]()}
{/each}
