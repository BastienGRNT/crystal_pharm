<script lang="ts">
	import type { DesignSnippets } from './snippets';
	import Sections from './Sections.svelte';

	// Sur-mesure : rien n'est exigé, pas même les informations de la pharmacie.
	let snippets: DesignSnippets<'custom'> = $props();
</script>

<Sections {...snippets} />
