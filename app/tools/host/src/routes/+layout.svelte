<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { AppShell, toolLinks, findCurrentToolHref } from '@crystal-pharm/ui';

	let { children }: { children: Snippet } = $props();
</script>

<AppShell {toolLinks} currentToolHref={findCurrentToolHref(page.url.pathname)}>
	{@render children()}
</AppShell>
