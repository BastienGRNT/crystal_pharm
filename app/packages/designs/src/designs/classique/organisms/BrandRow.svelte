<script lang="ts">
	import type { BrandsContent } from '../../../sections/brands';
	import Band from '../atoms/Band.svelte';
	import Heading from '../atoms/Heading.svelte';
	import BrandChip from '../molecules/BrandChip.svelte';

	let { list }: { list: BrandsContent } = $props();
</script>

<section>
	<Band>
		<Heading>{list.title}</Heading>
		<ul>
			{#each list.items as brand (brand.name)}
				<BrandChip {brand} />
			{/each}
		</ul>
	</Band>
</section>

<style>
	section {
		padding: 2.5rem 1.5rem;
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}
</style>
