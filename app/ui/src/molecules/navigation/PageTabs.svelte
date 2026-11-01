<script lang="ts">
	import type { FilterTab } from './filterTabs';

	type PageTabsProps = {
		label: string;
		tabs: readonly FilterTab[];
		/** Des onglets sur la même page (`href="#…"`) : le clic change d'onglet sans recharger. */
		onTabSelect?: (href: string) => void;
	};

	let { label, tabs, onTabSelect }: PageTabsProps = $props();

	function selectTab(event: MouseEvent, href: string): void {
		if (!onTabSelect) return;
		event.preventDefault();
		onTabSelect(href);
	}
</script>

<!-- Posés sur le filet de l'en-tête de page : l'onglet ouvert le souligne de l'accent, comme un intercalaire. -->
<nav aria-label={label} class="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] max-sm:gap-4">
	{#each tabs as tab (tab.href)}
		<a
			href={tab.href}
			aria-current={tab.isCurrent ? 'page' : undefined}
			onclick={(event) => selectTab(event, tab.href)}
			class="flex flex-none items-center gap-2 border-b-[3px] border-transparent pt-1 pb-3 text-[15px] leading-5 font-bold whitespace-nowrap text-ink-muted no-underline transition-colors duration-[120ms] hover:border-line-strong hover:text-ink aria-[current=page]:border-accent aria-[current=page]:text-ink"
		>
			{tab.label}
			{#if tab.count !== undefined}
				<span class="inline-grid h-5 min-w-5 place-items-center rounded-full bg-surface-muted px-1.5 text-[12px] leading-none font-bold text-ink-muted tabular-nums">
					{tab.count}
				</span>
			{/if}
			{#if tab.needsAttention}
				<span aria-hidden="true" class="size-2 rounded-full bg-danger"></span>
				<span class="sr-only">(à revoir)</span>
			{/if}
		</a>
	{/each}
</nav>
