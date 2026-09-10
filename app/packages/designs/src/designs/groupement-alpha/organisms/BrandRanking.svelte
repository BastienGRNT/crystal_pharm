<script lang="ts">
	import type { BrandsContent } from '../../../sections/brands';
	import RankedBrand from '../molecules/RankedBrand.svelte';

	let { list }: { list: BrandsContent } = $props();
</script>

<section>
	<h2>{list.title}</h2>
	<ol>
		{#each list.items as brand, index (brand.name)}
			<RankedBrand {brand} rank={index + 1} />
		{/each}
	</ol>
</section>

<style>
	section {
		background: #fafafa;
		padding: 4rem 1.5rem 5rem;
	}
	h2 {
		max-width: 46rem;
		margin: 0 auto 1.5rem;
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #71717a;
	}
	ol {
		max-width: 46rem;
		margin: 0 auto;
		padding: 0;
		list-style: none;
	}
</style>
