<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { catalogueFixeMeta } from '../CatalogueFixeLayout.svelte';

	type Item = ModuleProps<typeof catalogueFixeMeta, 'testimonials'>;
	let { testimonials }: { testimonials: Item[] } = $props();
</script>

<section>
	<h2>Avis clients</h2>
	<ul>
		{#each testimonials as t}
			<li>
				<blockquote>{t.quote}</blockquote>
				<span>— {t.author}</span>
			</li>
		{/each}
	</ul>
</section>
