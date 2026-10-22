<script lang="ts">
	import { AppointmentsPage } from '@crystal-pharm/booking';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AppointmentsPage {data} {form} />
