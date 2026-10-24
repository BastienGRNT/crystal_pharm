<script lang="ts">
	import { SiteAddressPage } from '@crystal-pharm/site-manager';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<SiteAddressPage {data} {form} />
