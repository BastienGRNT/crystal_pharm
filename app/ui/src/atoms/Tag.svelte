<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TagTone } from './tag';

	let { tone = 'neutral', children }: { tone?: TagTone; children: Snippet } = $props();

	const toneClasses: Record<TagTone, string> = {
		neutral: 'bg-surface-muted text-ink-muted',
		accent: 'bg-accent-soft text-accent-text',
		success: 'bg-success-soft text-success',
		warning: 'bg-warning-soft text-warning',
		danger: 'bg-danger-soft text-danger'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-xs px-[5px] text-[11px] leading-4 font-medium whitespace-nowrap {toneClasses[tone]}">
	{@render children()}
</span>
