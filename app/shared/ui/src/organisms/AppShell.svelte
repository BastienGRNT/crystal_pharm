<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ToolLink } from '../toolLinks';

	type AppShellProps = {
		toolLinks: readonly ToolLink[];
		currentToolHref: string;
		children: Snippet;
	};

	let { toolLinks, currentToolHref, children }: AppShellProps = $props();
</script>

<div class="min-h-screen bg-background font-sans text-text">
	<header class="border-b border-border bg-surface">
		<nav class="mx-auto flex max-w-6xl gap-2 px-4 py-3" aria-label="Outils">
			{#each toolLinks as toolLink (toolLink.href)}
				<a
					href={toolLink.href}
					data-sveltekit-reload
					aria-current={toolLink.href === currentToolHref ? 'page' : undefined}
					class="rounded-control px-3 py-2 text-text-muted hover:text-text aria-[current=page]:bg-accent aria-[current=page]:text-accent-text"
				>
					{toolLink.label}
				</a>
			{/each}
		</nav>
	</header>

	<main id="contenu" class="mx-auto max-w-6xl px-4 py-8">
		{@render children()}
	</main>
</div>
