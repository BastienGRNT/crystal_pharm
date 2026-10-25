<script lang="ts">
	import { ReceivedPrescriptionsPage } from '@crystal-pharm/prescriptions';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ReceivedPrescriptionsPage {data} />
