<script lang="ts">
	import type { Snippet } from 'svelte';

	// Le titre léger qui donne son caractère au design.
	let { children, size = 'normal' }: { children: Snippet; size?: 'normal' | 'large' } = $props();
</script>

<h2 class={size}>{@render children()}</h2>

<style>
	h2 {
		font-weight: 300;
		color: #0c4a6e;
		margin: 0 0 1rem;
	}
	.normal {
		font-size: 1.4rem;
	}
	.large {
		font-size: 1.9rem;
		margin: 0.5rem 0;
	}
</style>
