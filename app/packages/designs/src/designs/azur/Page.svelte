<script lang="ts">
	import design from './design';
	import AboutBlock from './organisms/AboutBlock.svelte';
	import HeroBanner from './organisms/HeroBanner.svelte';
	import HoursBlock from './organisms/HoursBlock.svelte';
	import IdentityBlock from './organisms/IdentityBlock.svelte';

	// Gamme Signature : seules `pharmacyInfo` et `openingHours` sont exigées.
	// La bannière et la présentation sont ajoutées librement ; ce design
	// n'affiche volontairement ni équipe, ni marques, ni avis.
	const { Host } = design;
</script>

<Host>
	{#snippet hero(banner)}<HeroBanner {banner} />{/snippet}
	{#snippet pharmacyInfo(pharmacy)}<IdentityBlock {pharmacy} />{/snippet}
	{#snippet about(text)}<AboutBlock {text} />{/snippet}
	{#snippet openingHours(hours)}<HoursBlock {hours} />{/snippet}
</Host>
