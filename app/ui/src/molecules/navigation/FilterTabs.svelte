<script lang="ts">
	import type { FilterTab } from './filterTabs';

	type FilterTabsProps = {
		label: string;
		tabs: FilterTab[];
	};

	let { label, tabs }: FilterTabsProps = $props();
</script>

<nav aria-label={label} class="relative flex gap-1 overflow-x-auto">
	{#each tabs as tab (tab.href)}
		<a
			href={tab.href}
			aria-current={tab.isCurrent ? 'page' : undefined}
			class="inline-flex h-control-sm items-center gap-2 rounded-full border border-transparent px-3.5 text-[14.5px] leading-5 font-bold whitespace-nowrap text-ink-muted no-underline hover:bg-surface-muted hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-app"
		>
			{tab.label}
			{#if tab.count !== undefined}
				<span
					class="inline-grid h-5 min-w-5 place-items-center rounded-full bg-current/12 px-1.5 text-[12px] leading-none font-bold tabular-nums"
				>
					{tab.count}
				</span>
			{/if}
		</a>
	{/each}
</nav>
