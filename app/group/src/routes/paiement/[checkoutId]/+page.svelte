<script lang="ts">
	import { TestCheckoutScreen } from '@crystal-pharm/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<TestCheckoutScreen
	description={data.description}
	amountLabel={data.amountLabel}
	lines={data.lines}
	cancelHref={data.returnPathname}
	outcomeFieldName="outcome"
	failureMessage={form?.failureMessage}
/>
