<script lang="ts">
	import type { OpeningHoursContent } from '../../../sections/opening-hours';
	import Card from '../atoms/Card.svelte';
	import CardTitle from '../atoms/CardTitle.svelte';

	let { hours }: { hours: OpeningHoursContent } = $props();
</script>

<Card>
	<CardTitle>{hours.title}</CardTitle>
	<ul>
		{#each hours.days as day (day.label)}
			<li><span>{day.label}</span><span>{day.hours}</span></li>
		{/each}
	</ul>
	{#if hours.note}<p>{hours.note}</p>{/if}
</Card>

<style>
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		display: flex;
		justify-content: space-between;
		padding: 0.4rem 0;
		border-bottom: 1px dashed #e2e8f0;
	}
	p {
		margin: 0.9rem 0 0;
		font-size: 0.9rem;
		color: #64748b;
	}
</style>
