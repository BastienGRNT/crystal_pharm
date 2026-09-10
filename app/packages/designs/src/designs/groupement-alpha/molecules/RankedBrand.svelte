<script lang="ts">
	import type { BrandsContent } from '../../../sections/brands';

	let { brand, rank }: { brand: BrandsContent['items'][number]; rank: number } = $props();
</script>

<li>
	<span class="rang">{String(rank).padStart(2, '0')}</span>
	{#if brand.site}
		<a href={brand.site} rel="noreferrer">{brand.name}</a>
	{:else}
		{brand.name}
	{/if}
</li>

<style>
	li {
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
		padding: 0.9rem 0;
		border-top: 1px solid #e4e4e7;
		font-size: 1.15rem;
	}
	.rang {
		font-size: 0.75rem;
		color: #a1a1aa;
		font-variant-numeric: tabular-nums;
	}
	a {
		color: inherit;
	}
</style>
