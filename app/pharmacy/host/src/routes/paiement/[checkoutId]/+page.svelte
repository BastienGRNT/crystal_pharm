<script lang="ts">
	import { CheckoutPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<CheckoutPage {data} {form} />
