<script lang="ts">
	import { TeamPlanningPage } from '@crystal-pharm/planning';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<TeamPlanningPage {data} {form} />
