<script lang="ts">
	import type { DesignSnippets } from './snippets';
	import Sections from './Sections.svelte';

	// Gamme Signature : seules les sections de `ASSURANCES.signature` sont
	// exigées. Tout le reste est libre — c'est la gamme des designs originaux.
	let snippets: DesignSnippets<'signature'> = $props();
</script>

<Sections {...snippets} />
