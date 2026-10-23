<script lang="ts">
	import { page } from '$app/state';
	import { ToolsHomePage } from '@crystal-pharm/home';
	import { toolLinks } from '$lib/toolLinks';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ToolsHomePage {data} {toolLinks} searchParams={page.url.searchParams} />
