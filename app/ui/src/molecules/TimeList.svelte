<script lang="ts">
	import Icon from '../atoms/icons/Icon.svelte';
	import type { TimeListItem, TimeListItemTone } from './timeList';

	type TimeListProps = {
		label: string;
		items: TimeListItem[];
	};

	let { label, items }: TimeListProps = $props();

	const markerClasses: Record<TimeListItemTone, string> = {
		accent: 'bg-accent',
		neutral: 'bg-line-strong',
		pending: 'border border-dashed border-accent bg-surface',
		danger: 'bg-danger'
	};
</script>

<ul aria-label={label} class="divide-y divide-line-soft rounded-md border border-line bg-surface shadow-card">
	{#each items as item (item.id)}
		<li>
			<svelte:element
				this={item.href ? 'a' : 'div'}
				href={item.href}
				class="flex min-h-12 items-center gap-3 px-4 py-2.5 no-underline {item.href
					? 'transition-colors duration-[120ms] hover:bg-surface-subtle'
					: ''}"
			>
				{#if item.timeLabel !== undefined}
					<span class="w-11 flex-none text-[13px] leading-[18px] font-semibold text-ink tabular-nums">{item.timeLabel}</span>
				{/if}
				<span aria-hidden="true" class="h-8 w-1 flex-none rounded-full {markerClasses[item.tone]}"></span>
				<span class="grid min-w-0 flex-1">
					<span class="truncate text-[13.5px] leading-[19px] font-medium text-ink">
						{item.title}{#if item.statusLabel}<span class="sr-only">, {item.statusLabel}</span>{/if}
					</span>
					{#if item.detail}<span class="truncate text-[12.5px] leading-[17px] text-ink-muted">{item.detail}</span>{/if}
				</span>
				{#if item.href}<Icon name="arrow-right" size={16} class="text-ink-subtle" />{/if}
			</svelte:element>
		</li>
	{/each}
</ul>
