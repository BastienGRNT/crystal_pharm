<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ToolLink } from '../toolLinks';
	import SideNav from './SideNav.svelte';
	import TopBar from './TopBar.svelte';

	type AppShellProps = {
		toolLinks: readonly ToolLink[];
		currentToolHref: string;
		children: Snippet;
	};

	let { toolLinks, currentToolHref, children }: AppShellProps = $props();

	const currentToolLink = $derived(
		toolLinks.find((toolLink) => toolLink.href === currentToolHref)
	);
</script>

<div class="flex min-h-screen bg-app font-sans text-ink">
	<SideNav {toolLinks} {currentToolHref} />

	<div class="flex min-w-0 flex-1 flex-col" data-module={currentToolLink?.module}>
		<TopBar sectionLabel={currentToolLink?.label ?? ''} />

		<main id="contenu" class="flex flex-col gap-3.5 px-7 pt-5 pb-10 [&>*]:min-w-0 [&>*]:flex-none">
			{@render children()}
		</main>
	</div>
</div>
