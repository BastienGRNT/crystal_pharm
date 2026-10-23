<script lang="ts">
	import { formatEuros, parseEurosToCents, priceForPeriod } from '@crystal-pharm/billing-db/domain';
	import { Alert, ChoiceGroup } from '@crystal-pharm/ui';
	import type { GroupFormErrors, GroupFormValues } from '$lib/groupForm/groupFormValues';

	type PaymentStepProps = {
		values: GroupFormValues;
		annualFreeMonths: number;
		fieldErrors: GroupFormErrors;
	};

	let { values = $bindable(), annualFreeMonths, fieldErrors }: PaymentStepProps = $props();

	const flatRatePriceCents = $derived(parseEurosToCents(values.flatRatePrice) ?? 0);
	const canPayYearly = $derived(values.billingMode === 'flat_rate');

	const paymentMethodOptions = [
		{
			value: 'invoice',
			label: 'Par virement',
			icon: 'receipt' as const,
			description: 'Actif dès l’enregistrement. Il reçoit une facture à chaque échéance.'
		},
		{
			value: 'card',
			label: 'Par carte',
			icon: 'credit-card' as const,
			description: 'Il active son contrat en payant la première échéance ; ensuite, prélevé automatiquement.'
		}
	];
	const billingPeriodOptions = $derived([
		{ value: 'monthly', label: 'Chaque mois', description: `${formatEuros(flatRatePriceCents)} HT par mois.` },
		{
			value: 'yearly',
			label: `Chaque année · ${annualFreeMonths} mois offerts`,
			description: `${formatEuros(priceForPeriod(flatRatePriceCents, 'yearly', annualFreeMonths))} HT par an au lieu de ${formatEuros(flatRatePriceCents * 12)}.`
		}
	]);

	$effect(() => {
		if (!canPayYearly && values.billingPeriod === 'yearly') values.billingPeriod = 'monthly';
	});
</script>

<div class="grid gap-5">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">Comment le groupement règle ?</h2>
		<p class="text-small text-ink-muted">Le moyen de paiement et le rythme des échéances.</p>
	</div>

	{#if values.whoPays === 'pharmacies'}
		<Alert tone="info" title="Rien à régler">Le groupement ne paie rien : passez à la vérification.</Alert>
	{:else}
		<ChoiceGroup name="choice-paymentMethod" legend="Moyen de paiement" isLegendVisible layout="cards" options={paymentMethodOptions} bind:value={values.paymentMethod} />
		{#if fieldErrors.paymentMethod}<p class="text-small font-medium text-danger">{fieldErrors.paymentMethod}</p>{/if}

		{#if canPayYearly}
			<ChoiceGroup name="choice-billingPeriod" legend="Rythme" isLegendVisible layout="cards" options={billingPeriodOptions} bind:value={values.billingPeriod} />
		{:else}
			<p class="text-small text-ink-muted">À l’usage, la facture suit ses pharmacies : elle tombe chaque mois. Le paiement à l’année est réservé au forfait.</p>
		{/if}
		{#if fieldErrors.billingPeriod}<p class="text-small font-medium text-danger">{fieldErrors.billingPeriod}</p>{/if}
	{/if}
</div>
