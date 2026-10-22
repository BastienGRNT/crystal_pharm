<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<span
	class="inline-flex h-[22px] items-center rounded-xs bg-surface-muted px-2 text-[12px] leading-none font-medium whitespace-nowrap text-ink-muted"
>
	{@render children()}
</span>
