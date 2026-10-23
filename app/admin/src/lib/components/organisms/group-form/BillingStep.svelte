<script lang="ts">
	import type { FlatRateOffer } from '@crystal-pharm/billing-db';
	import {
		computeOverageUnitPrice,
		describeGroupContractTerms,
		formatCentsForInput,
		formatEuros,
		parseEurosToCents,
		type ToolCatalog,
		type ToolCoverage
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, ChoiceGroup, Field, UnitInput } from '@crystal-pharm/ui';
	import type { GroupFormErrors, GroupFormValues } from '$lib/groupForm/groupFormValues';

	type BillingStepProps = {
		values: GroupFormValues;
		catalog: ToolCatalog;
		coverages: ToolCoverage[];
		flatRateOffers: FlatRateOffer[];
		fieldErrors: GroupFormErrors;
	};

	let { values = $bindable(), catalog, coverages, flatRateOffers, fieldErrors }: BillingStepProps = $props();

	const customOfferValue = 'sur-mesure';
	let chosenOffer = $state(values.flatRateOfferId || customOfferValue);

	const usageCostPerPharmacyCents = $derived(describeGroupContractTerms(catalog, coverages).everyToolForPharmacy.groupPriceCents);
	const billingModeOptions = $derived([
		{
			value: 'flat_rate',
			label: 'Un forfait',
			icon: 'package' as const,
			description: 'Un prix fixe par mois pour un nombre de pharmacies, quel que soit leur usage. Le plus simple à suivre.'
		},
		{
			value: 'usage',
			label: 'À l’usage',
			icon: 'receipt' as const,
			description: `Chaque mois, ce que coûtent vraiment ses pharmacies : jusqu’à ${formatEuros(usageCostPerPharmacyCents)} HT par pharmacie.`
		}
	]);
	const offerOptions = $derived([
		...flatRateOffers.map((offer) => ({
			value: offer.offerId,
			label: offer.label,
			description: `${offer.pharmacyQuota} pharmacies · ${formatEuros(offer.monthlyPriceCents)} HT / mois`
		})),
		{ value: customOfferValue, label: 'Sur mesure', description: 'Un prix et un nombre de pharmacies négociés pour ce groupement.' }
	]);

	const flatRatePriceCents = $derived(parseEurosToCents(values.flatRatePrice));
	const pharmacyQuota = $derived(Number(values.pharmacyQuota));

	function applyOffer(offerValue: string): void {
		const offer = flatRateOffers.find((candidate) => candidate.offerId === offerValue);
		values.flatRateOfferId = offer?.offerId ?? '';
		if (!offer) return;
		values.flatRatePrice = formatCentsForInput(offer.monthlyPriceCents);
		values.pharmacyQuota = String(offer.pharmacyQuota);
	}
</script>

<div class="grid gap-5">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">Comment facturer le groupement ?</h2>
		<p class="text-small text-ink-muted">Ce que le groupement paie à Crystal Pharm, hors taxes.</p>
	</div>

	{#if values.whoPays === 'pharmacies'}
		<Alert tone="info" title="Rien à facturer">Le groupement ne paie aucun module : seules ses pharmacies paient, avec leur remise.</Alert>
	{:else}
		<ChoiceGroup name="choice-billingMode" legend="Comment facturer le groupement" layout="cards" options={billingModeOptions} bind:value={values.billingMode} />

		{#if values.billingMode === 'flat_rate'}
			<ChoiceGroup
				name="choice-flatRateOffer"
				legend="Le forfait"
				isLegendVisible
				layout="cards"
				options={offerOptions}
				bind:value={chosenOffer}
				onchange={applyOffer}
			/>
			<div class="grid gap-4 sm:grid-cols-2">
				<Field label="Prix du forfait" hint="Repris de l’offre, modifiable." errorMessage={fieldErrors.flatRatePrice}>
					{#snippet control(controlAttributes)}
						<UnitInput {...controlAttributes} unit="€ HT / mois" inputmode="decimal" bind:value={values.flatRatePrice} />
					{/snippet}
				</Field>
				<Field label="Pour combien de pharmacies" errorMessage={fieldErrors.pharmacyQuota}>
					{#snippet control(controlAttributes)}
						<UnitInput {...controlAttributes} unit="pharmacies" inputmode="numeric" bind:value={values.pharmacyQuota} />
					{/snippet}
				</Field>
			</div>
			{#if flatRatePriceCents !== undefined && pharmacyQuota > 0}
				<p class="rounded-md bg-surface-subtle px-3 py-2 text-body text-ink">
					Soit <strong class="font-semibold">{formatEuros(computeOverageUnitPrice(flatRatePriceCents, pharmacyQuota))} HT par pharmacie</strong>.
					Au-delà de {pharmacyQuota}, le groupement peut quand même inviter : chaque pharmacie en plus coûte ce même prix.
				</p>
			{/if}
		{/if}
	{/if}
</div>
