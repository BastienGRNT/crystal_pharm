<script lang="ts">
	import { SiteOverviewPage } from '@crystal-pharm/site-manager';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<SiteOverviewPage {data} />
