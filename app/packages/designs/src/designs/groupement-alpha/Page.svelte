<script lang="ts">
	import design from './design';
	import AlphaHero from './organisms/AlphaHero.svelte';
	import BrandRanking from './organisms/BrandRanking.svelte';

	// Sur-mesure : rien n'est exigé, pas même les informations de la pharmacie.
	const { Host } = design;
</script>

<Host>
	{#snippet hero(banner)}<AlphaHero {banner} />{/snippet}
	{#snippet brands(list)}<BrandRanking {list} />{/snippet}
</Host>
