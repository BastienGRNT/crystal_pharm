<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { StatusBadgeTone } from './statusBadge';

	type StatusBadgeProps = {
		tone: StatusBadgeTone;
		children: Snippet;
	};

	let { tone, children }: StatusBadgeProps = $props();

	const toneClasses: Record<StatusBadgeTone, string> = {
		success: 'bg-success-soft text-success',
		warning: 'bg-warning-soft text-warning',
		danger: 'bg-danger-soft text-danger',
		neutral: 'bg-surface-muted text-ink-subtle'
	};
</script>

<span
	class="inline-flex max-w-full items-center gap-1.5 rounded-full px-[9px] py-px text-[12px] leading-5 font-medium before:size-1.5 before:flex-none before:rounded-full before:bg-current before:content-[''] {toneClasses[
		tone
	]}"
>
	<span class="truncate">{@render children()}</span>
</span>
