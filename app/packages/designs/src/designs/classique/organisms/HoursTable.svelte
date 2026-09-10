<script lang="ts">
	import type { OpeningHoursContent } from '../../../sections/opening-hours';
	import Band from '../atoms/Band.svelte';
	import Heading from '../atoms/Heading.svelte';

	let { hours }: { hours: OpeningHoursContent } = $props();
</script>

<section>
	<Band>
		<Heading ruled>{hours.title}</Heading>
		<table>
			<tbody>
				{#each hours.days as day (day.label)}
					<tr><th scope="row">{day.label}</th><td>{day.hours}</td></tr>
				{/each}
			</tbody>
		</table>
		{#if hours.note}<p>{hours.note}</p>{/if}
	</Band>
</section>

<style>
	section {
		padding: 2.5rem 1.5rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		text-align: left;
		font-weight: 600;
		padding: 0.45rem 0;
	}
	td {
		text-align: right;
		padding: 0.45rem 0;
		font-variant-numeric: tabular-nums;
	}
	tr + tr th,
	tr + tr td {
		border-top: 1px solid #e5e7eb;
	}
	p {
		margin-top: 1rem;
		font-style: italic;
		color: #555;
	}
</style>
