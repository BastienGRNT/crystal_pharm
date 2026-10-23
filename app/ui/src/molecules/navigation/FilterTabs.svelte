<script lang="ts">
	import type { FilterTab } from './filterTabs';

	type FilterTabsProps = {
		label: string;
		tabs: FilterTab[];
	};

	let { label, tabs }: FilterTabsProps = $props();
</script>

<nav aria-label={label} class="flex gap-5 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-line)]">
	{#each tabs as tab (tab.href)}
		<a
			href={tab.href}
			aria-current={tab.isCurrent ? 'page' : undefined}
			class="inline-flex items-center gap-1.5 border-b-2 border-transparent pt-2 pb-2.5 text-[13.5px] leading-[18px] font-medium whitespace-nowrap text-ink-muted no-underline hover:text-ink aria-[current=page]:border-accent aria-[current=page]:text-ink"
		>
			{tab.label}
			{#if tab.count !== undefined}
				<span
					class="inline-grid h-[18px] min-w-5 place-items-center rounded-full bg-surface-muted px-1.5 text-[11px] leading-none font-semibold text-ink-muted tabular-nums"
				>
					{tab.count}
				</span>
			{/if}
		</a>
	{/each}
</nav>
