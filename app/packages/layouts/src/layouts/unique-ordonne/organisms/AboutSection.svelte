<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { uniqueOrdonneMeta } from '../UniqueOrdonneLayout.svelte';

	type Item = ModuleProps<typeof uniqueOrdonneMeta, 'about'>;
	let { about }: { about: Item } = $props();
</script>

<section>
	<h2>{about.title}</h2>
	<p>{about.text}</p>
</section>
