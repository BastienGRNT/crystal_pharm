<script lang="ts">
	import type { BrandsContent } from '../../../sections/brands';
	import Card from '../atoms/Card.svelte';
	import CardTitle from '../atoms/CardTitle.svelte';

	let { list }: { list: BrandsContent } = $props();
</script>

<Card>
	<CardTitle>{list.title}</CardTitle>
	<div class="logos">
		{#each list.items as brand (brand.name)}
			{#if brand.logo}
				<img src={brand.logo} alt={brand.name} title={brand.name} />
			{:else}
				<span>{brand.name}</span>
			{/if}
		{/each}
	</div>
</Card>

<style>
	.logos {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.5rem;
	}
	img {
		height: 2rem;
		filter: grayscale(1);
		opacity: 0.75;
	}
	span {
		font-weight: 600;
		color: #475569;
	}
</style>
