<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { AppShell, toolLinks } from '@crystal-pharm/ui';

	let { children }: { children: Snippet } = $props();
</script>

<AppShell {toolLinks} currentToolHref="/prescriptions">
	{@render children()}
</AppShell>
