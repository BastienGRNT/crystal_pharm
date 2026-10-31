<script lang="ts">
	import { OnDutyPage } from '@crystal-pharm/site-manager';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<OnDutyPage {data} {form} />
