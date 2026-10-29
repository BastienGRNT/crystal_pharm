<script lang="ts">
	import { PlanningSettingsPage } from '@crystal-pharm/planning';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PlanningSettingsPage {data} {form} />
