<script lang="ts">
	import { ReceivedPrescriptionsPage } from '@crystal-pharm/prescriptions';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<ReceivedPrescriptionsPage {data} {form} />
