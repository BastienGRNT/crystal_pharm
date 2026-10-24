<script lang="ts">
	import { page } from '$app/state';
	import { ToolsHomePage } from '@crystal-pharm/home';
	import { toolLinks } from '$lib/toolLinks';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<ToolsHomePage {data} {toolLinks} confirmationFailure={form?.confirmationFailure} searchParams={page.url.searchParams} />
