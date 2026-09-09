<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'brands'> = $props();
</script>

<section>
	<h2>Nos marques</h2>
	<ul>
		{#each data as brand}
			<li>
				<img src={brand.logoUrl} alt={brand.name} width="48" height="48" />
				<span>{brand.name} — {brand.description}</span>
			</li>
		{/each}
	</ul>
</section>
