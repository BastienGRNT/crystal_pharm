<script lang="ts">
	import type { PharmacyInfoContent } from '../../../sections/pharmacy-info';
	import Card from '../atoms/Card.svelte';

	let { pharmacy }: { pharmacy: PharmacyInfoContent } = $props();
</script>

<Card tone="dark">
	{#if pharmacy.logo}<img src={pharmacy.logo} alt="" />{/if}
	<h1>{pharmacy.name}</h1>
	<p>{pharmacy.address}</p>
	{#if pharmacy.phone}<a href={pharmacy.phone}>{pharmacy.phone.replace('tel:', '')}</a>{/if}
</Card>

<style>
	img {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.75rem;
		object-fit: cover;
	}
	h1 {
		margin: 0.75rem 0 0.25rem;
		font-size: 1.6rem;
	}
	p {
		margin: 0;
		opacity: 0.8;
	}
	a {
		display: inline-block;
		margin-top: 0.9rem;
		color: #38bdf8;
	}
</style>
