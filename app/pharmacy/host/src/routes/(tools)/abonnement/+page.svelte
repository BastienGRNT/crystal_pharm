<script lang="ts">
	import { page } from '$app/state';
	import { SubscriptionPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<SubscriptionPage {data} {form} searchParams={page.url.searchParams} />
