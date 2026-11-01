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
		/** La carte entière ouvre la liste que le chiffre compte. */
		href?: string;
	};

	let { label, value, icon, detail, href }: StatCardProps = $props();
</script>

{#snippet content()}
	<span class="flex items-center gap-1.5 text-eyebrow text-ink-muted">
		{#if icon}<Icon name={icon} size={16} class="text-accent-text" />{/if}
		{label}
		{#if href}<Icon name="arrow-right" size={14} class="ml-auto text-ink-subtle transition-transform duration-[120ms] group-hover:translate-x-0.5" />{/if}
	</span>
	<span class="text-kpi text-ink tabular-nums">{value}</span>
	{#if detail}
		<span class="text-small text-ink-muted">{@render detail()}</span>
	{/if}
{/snippet}

{#if href}
	<a
		{href}
		class="group grid content-start gap-2 rounded-xl border border-line bg-surface p-5 no-underline shadow-card transition-colors duration-[120ms] hover:border-accent"
	>
		{@render content()}
	</a>
{:else}
	<div class="grid content-start gap-2 rounded-xl border border-line bg-surface p-5 shadow-card">
		{@render content()}
	</div>
{/if}
