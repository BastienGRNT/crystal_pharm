<script lang="ts">
	import { ToolsHomePage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ToolsHomePage {data} />
