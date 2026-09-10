<script lang="ts">
	import type { OpeningHoursContent } from '../../../sections/opening-hours';
	import SoftTitle from '../atoms/SoftTitle.svelte';

	let { hours }: { hours: OpeningHoursContent } = $props();
</script>

<section>
	<SoftTitle>{hours.title}</SoftTitle>
	<dl>
		{#each hours.days as day (day.label)}
			<dt>{day.label}</dt>
			<dd>{day.hours}</dd>
		{/each}
	</dl>
	{#if hours.note}<p>{hours.note}</p>{/if}
</section>

<style>
	section {
		background: #f0f9ff;
		padding: 3rem 1.5rem 4rem;
		text-align: center;
	}
	dl {
		max-width: 26rem;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem 1rem;
	}
	dt {
		text-align: right;
		color: #475569;
	}
	dd {
		margin: 0;
		text-align: left;
		font-variant-numeric: tabular-nums;
	}
	p {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #64748b;
	}
</style>
