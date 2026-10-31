<script lang="ts">
	import type { PlanningLegendItem, PlanningLegendSwatch } from './planningLegend';

	let { items }: { items: PlanningLegendItem[] } = $props();

	const swatchClasses: Record<PlanningLegendSwatch, string> = {
		absence: 'bg-absence',
		uncovered: 'bg-danger-soft shadow-[inset_0_0_0_1px_var(--danger)]',
		closed: 'bg-surface-subtle shadow-[inset_0_0_0_1px_var(--line)]',
		now: 'w-0.5 bg-danger'
	};
</script>

<ul class="flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] leading-[17px] text-ink-muted" aria-label="Légende">
	{#each items as item (item.label)}
		<li class="flex items-center gap-2">
			<span aria-hidden="true" class="h-3 {item.swatch === 'now' ? '' : 'w-4'} rounded-xs {swatchClasses[item.swatch]}"></span>
			{item.label}
		</li>
	{/each}
</ul>
