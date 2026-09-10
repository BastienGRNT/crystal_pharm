<script lang="ts">
	import type { PharmacyInfoContent } from '../../../sections/pharmacy-info';
	import Kicker from '../atoms/Kicker.svelte';
	import SoftTitle from '../atoms/SoftTitle.svelte';

	let { pharmacy }: { pharmacy: PharmacyInfoContent } = $props();
</script>

<section>
	<Kicker>Votre pharmacie</Kicker>
	<SoftTitle size="large">{pharmacy.name}</SoftTitle>
	<address>{pharmacy.address}</address>
	{#if pharmacy.phone}<a href={pharmacy.phone}>Nous joindre</a>{/if}
</section>

<style>
	section {
		max-width: 42rem;
		margin: 0 auto;
		padding: 3.5rem 1.5rem 2rem;
		text-align: center;
	}
	address {
		font-style: normal;
		color: #475569;
	}
	a {
		display: inline-block;
		margin-top: 1.2rem;
		color: #0284c7;
	}
</style>
