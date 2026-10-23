<script lang="ts">
	import { TestCheckoutScreen } from '@crystal-pharm/ui';
	import type { CheckoutPageData } from './checkoutPageData';

	let { data, form }: { data: CheckoutPageData; form: { failureMessage: string } | null | undefined } = $props();
</script>

<TestCheckoutScreen
	description={data.description}
	amountLabel={data.amountLabel}
	lines={data.lines}
	cancelHref={data.returnPathname}
	outcomeFieldName="outcome"
	failureMessage={form?.failureMessage}
/>
