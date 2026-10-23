<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { DeveloperToolbar } from '@crystal-pharm/ui';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{@render children()}

{#if data.developerToolbar}
	<DeveloperToolbar {...data.developerToolbar} currentPathname={`${page.url.pathname}${page.url.search}`} />
{/if}
