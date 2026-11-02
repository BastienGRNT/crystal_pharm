<script lang="ts">
	import { AppointmentSettingsPage } from '@crystal-pharm/booking';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AppointmentSettingsPage {data} {form} />
