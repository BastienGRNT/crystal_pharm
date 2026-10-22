<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<span class="inline-flex rounded-xs bg-surface-muted px-[5px] text-[11px] leading-4 font-medium text-ink-muted">
	{@render children()}
</span>
