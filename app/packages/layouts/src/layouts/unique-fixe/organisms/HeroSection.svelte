<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { uniqueFixeMeta } from '../UniqueFixeLayout.svelte';

	type Item = ModuleProps<typeof uniqueFixeMeta, 'hero'>;
	let { hero }: { hero: Item } = $props();
</script>

<section>
	<h1>{hero.title}</h1>
	<p>{hero.subtitle}</p>
	<img src={hero.imageUrl} alt={hero.title} />
</section>
