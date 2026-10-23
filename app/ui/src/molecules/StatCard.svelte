<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import type { IconName } from '../atoms/icons/icons';

	type StatCardProps = {
		label: string;
		value: string;
		icon?: IconName;
		/** Une précision sous le chiffre (« sur 20 places »), ou une jauge. */
		detail?: Snippet;
	};

	let { label, value, icon, detail }: StatCardProps = $props();
</script>

<div class="grid content-start gap-1.5 rounded-lg border border-line bg-surface p-4 shadow-card">
	<p class="flex items-center gap-1.5 text-label text-ink-muted">
		{#if icon}<Icon name={icon} size={15} class="text-accent-text" />{/if}
		{label}
	</p>
	<p class="text-kpi text-ink">{value}</p>
	{#if detail}
		<div class="text-small text-ink-muted">{@render detail()}</div>
	{/if}
</div>
