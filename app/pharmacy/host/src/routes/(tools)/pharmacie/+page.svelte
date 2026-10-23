<script lang="ts">
	import { PharmacyPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PharmacyPage {data} {form} />
