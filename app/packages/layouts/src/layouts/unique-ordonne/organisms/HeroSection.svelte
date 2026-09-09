<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { uniqueOrdonneMeta } from '../UniqueOrdonneLayout.svelte';

	type Item = ModuleProps<typeof uniqueOrdonneMeta, 'hero'>;
	let { hero }: { hero: Item } = $props();
</script>

<section>
	<h1>{hero.title}</h1>
	<p>{hero.subtitle}</p>
	<img src={hero.imageUrl} alt={hero.title} />
</section>
