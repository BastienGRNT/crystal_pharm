<script lang="ts">
	import { PageHeader, ToolCard, toolLinks } from '@crystal-pharm/ui';
	import type { ToolsHomePageData } from './toolsHomePageData';

	let { data }: { data: ToolsHomePageData } = $props();

	const homeToolHref = '/';
	const tools = toolLinks.filter((toolLink) => toolLink.href !== homeToolHref);
</script>

<svelte:head>
	<title>Accueil · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Accueil" context="{data.todayTitle} · {tools.length} outils" icon="house" />

<section aria-labelledby="tools-title" class="grid gap-3">
	<h2 id="tools-title" class="text-[11px] leading-4 font-semibold tracking-[0.06em] text-ink-subtle uppercase">
		Vos outils
	</h2>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
		{#each tools as toolLink (toolLink.href)}
			<li class="grid"><ToolCard {toolLink} /></li>
		{/each}
	</ul>
</section>
