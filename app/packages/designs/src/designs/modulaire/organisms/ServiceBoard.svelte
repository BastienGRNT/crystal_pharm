<script lang="ts">
	import type { ServicesContent } from '../../../sections/services';
	import Card from '../atoms/Card.svelte';
	import CardTitle from '../atoms/CardTitle.svelte';
	import ServiceTile from '../molecules/ServiceTile.svelte';

	let { list }: { list: ServicesContent } = $props();
</script>

<Card>
	<CardTitle>{list.title}</CardTitle>
	<div class="grille">
		{#each list.items as service (service.name)}
			<ServiceTile {service} />
		{/each}
	</div>
</Card>

<style>
	.grille {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 0.75rem;
	}
</style>
