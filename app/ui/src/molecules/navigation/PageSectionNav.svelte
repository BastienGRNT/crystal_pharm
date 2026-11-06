<script lang="ts">
	import type { PageSection } from './pageSectionNav';

	type PageSectionNavProps = {
		label: string;
		sections: readonly PageSection[];
	};

	let { label, sections }: PageSectionNavProps = $props();
</script>

<!-- Une page longue se parcourt par ses titres : la rangée suit la lecture, sous la barre du haut. -->
<nav
	aria-label={label}
	class="sticky top-topbar z-10 lg:top-band -mx-1 flex gap-1.5 overflow-x-auto bg-app/95 px-1 py-2 backdrop-blur [scrollbar-width:none]"
>
	{#each sections as section (section.id)}
		<a
			href="#{section.id}"
			class="flex flex-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-[14px] leading-5 font-medium no-underline transition-colors duration-[120ms] {section.hasError
				? 'border-danger text-danger'
				: 'border-line bg-surface text-ink hover:border-accent'}"
		>
			{section.label}
			{#if section.count !== undefined}
				<span class="rounded-full bg-surface-subtle px-1.5 text-label text-ink-muted tabular-nums">{section.count}</span>
			{/if}
		</a>
	{/each}
</nav>
