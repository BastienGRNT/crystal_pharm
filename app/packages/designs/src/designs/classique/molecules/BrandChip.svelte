<script lang="ts">
	import type { BrandsContent } from '../../../sections/brands';

	let { brand }: { brand: BrandsContent['items'][number] } = $props();
</script>

<li>
	{#if brand.site}
		<a href={brand.site} rel="noreferrer">
			{#if brand.logo}<img src={brand.logo} alt="" />{/if}<span>{brand.name}</span>
		</a>
	{:else}
		{#if brand.logo}<img src={brand.logo} alt="" />{/if}<span>{brand.name}</span>
	{/if}
</li>

<style>
	li {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 0.6rem 0.9rem;
	}
	a {
		color: inherit;
		text-decoration: none;
	}
	img {
		height: 1.5rem;
		vertical-align: middle;
		margin-right: 0.5rem;
	}
</style>
