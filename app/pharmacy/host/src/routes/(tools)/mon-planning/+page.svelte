<script lang="ts">
	import { MyPlanningPage } from '@crystal-pharm/planning';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<MyPlanningPage {data} {form} />
