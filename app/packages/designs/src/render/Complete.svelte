<script lang="ts">
	import type { DesignSnippets } from './snippets';
	import Sections from './Sections.svelte';

	// Gamme Complet : le compilateur exige ici tous les snippets promis par
	// `ASSURANCES.complete`. En oublier un, c'est `Property '…' is missing`.
	let snippets: DesignSnippets<'complete'> = $props();
</script>

<Sections {...snippets} />
