<script lang="ts">
	type PriceLabelProps = {
		/** Le montant à payer, déjà formaté (« 31,20 € »). */
		amountLabel: string;
		/** Le prix d'avant remise, barré à côté. */
		previousAmountLabel?: string;
		periodLabel?: string;
	};

	let { amountLabel, previousAmountLabel, periodLabel }: PriceLabelProps = $props();
</script>

<span class="inline-flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
	<span class="body-strong text-ink">{amountLabel}</span>
	{#if periodLabel}<span class="text-small text-ink-muted">{periodLabel}</span>{/if}
	{#if previousAmountLabel}
		<s class="text-small text-ink-subtle"><span class="sr-only">au lieu de </span>{previousAmountLabel}</s>
	{/if}
</span>
