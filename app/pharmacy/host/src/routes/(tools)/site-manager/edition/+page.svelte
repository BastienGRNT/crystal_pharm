<script lang="ts">
	import { SiteEditorPage } from '@crystal-pharm/site-manager';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<SiteEditorPage {data} {form} />
