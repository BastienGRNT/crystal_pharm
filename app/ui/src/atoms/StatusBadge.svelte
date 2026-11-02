<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { StatusBadgeTone } from './statusBadge';

	type StatusBadgeProps = {
		tone: StatusBadgeTone;
		children: Snippet;
	};

	let { tone, children }: StatusBadgeProps = $props();

	const toneClasses: Record<StatusBadgeTone, string> = {
		success: 'border-success/45 bg-success-soft text-success',
		warning: 'border-warning/45 bg-warning-soft text-warning',
		danger: 'border-danger/45 bg-danger-soft text-danger',
		neutral: 'border-line-strong/45 bg-surface-subtle text-ink-muted'
	};
</script>

<span
	class="inline-flex max-w-full items-center gap-1.5 rounded-sm border px-2 py-px text-[12px] leading-5 font-bold tracking-[0.06em] uppercase before:size-1.5 before:flex-none before:rounded-full before:bg-current before:content-[''] {toneClasses[
		tone
	]}"
>
	<span class="truncate">{@render children()}</span>
</span>
