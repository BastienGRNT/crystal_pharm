<script lang="ts">
	import type { FlatRateOffer } from '@crystal-pharm/billing-db';
	import { computeOverageUnitPrice, formatCentsForInput, formatEuros, parseEurosToCents } from '@crystal-pharm/billing-db/domain';
	import { ChoiceGroup, Field, UnitInput } from '@crystal-pharm/ui';
	import type { GroupFormErrors, GroupFormValues } from '$lib/groupForm/groupFormValues';

	type GroupBillingFieldsProps = {
		values: GroupFormValues;
		flatRateOffers: FlatRateOffer[];
		fieldErrors: GroupFormErrors;
	};

	let { values = $bindable(), flatRateOffers, fieldErrors }: GroupBillingFieldsProps = $props();

	const customOfferValue = 'sur-mesure';

	const paymentMethodOptions = [
		{ value: 'invoice', label: 'Sur facture', icon: 'receipt' as const, description: 'Actif dès la création. Une facture par mois, à régler par virement.' },
		{ value: 'card', label: 'Par carte', icon: 'credit-card' as const, description: 'Le groupement active son contrat en payant ; ensuite, prélevé chaque mois.' }
	];
	const billingModeOptions = [
		{ value: 'usage', label: 'À l’usage', description: 'Chaque mois, la somme de ce que coûtent ses pharmacies membres, module par module.' },
		{ value: 'flat_rate', label: 'Forfait', description: 'Un prix fixe par mois pour un nombre de places, quel que soit l’usage.' }
	];
	const offerOptions = $derived([
		...flatRateOffers.map((offer) => ({
			value: offer.offerId,
			label: offer.label,
			description: `${offer.pharmacyQuota} pharmacies · ${formatEuros(offer.monthlyPriceCents)} HT / mois`
		})),
		{ value: customOfferValue, label: 'Sur mesure', description: 'Un prix négocié pour ce groupement, avec le quota saisi plus haut.' }
	]);

	let chosenOffer = $state(values.flatRateOfferId || customOfferValue);

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

<div class="grid gap-4">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">La facturation</h2>
		<p class="text-small text-ink-muted">Comment le groupement paie, et ce qu’il paie. Les prix sont HT.</p>
	</div>

	<ChoiceGroup name="paymentMethod" legend="Comment le groupement paie" isLegendVisible layout="cards" options={paymentMethodOptions} bind:value={values.paymentMethod} />
	{#if fieldErrors.paymentMethod}<p class="text-small font-medium text-danger">{fieldErrors.paymentMethod}</p>{/if}

	<ChoiceGroup name="billingMode" legend="Ce que le groupement paie" isLegendVisible layout="cards" options={billingModeOptions} bind:value={values.billingMode} />

	{#if values.billingMode === 'flat_rate'}
		<input type="hidden" name="flatRateOfferId" value={values.flatRateOfferId} />
		<ChoiceGroup
			name="flatRateOffer"
			legend="Le forfait"
			isLegendVisible
			layout="cards"
			options={offerOptions}
			bind:value={chosenOffer}
			onchange={applyOffer}
		/>
		<div class="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-end">
			<Field label="Prix du forfait" hint="Repris de l’offre, modifiable." errorMessage={fieldErrors.flatRatePrice}>
				{#snippet control(controlAttributes)}
					<UnitInput {...controlAttributes} name="flatRatePrice" unit="€ HT / mois" inputmode="decimal" bind:value={values.flatRatePrice} />
				{/snippet}
			</Field>
			{#if flatRatePriceCents !== undefined && pharmacyQuota > 0}
				<p class="pb-2 text-small text-ink-muted">
					{pharmacyQuota} places, soit {formatEuros(computeOverageUnitPrice(flatRatePriceCents, pharmacyQuota))} HT par pharmacie.
					Au-delà, le groupement peut inviter : chaque pharmacie en plus coûte ce même prix chaque mois.
				</p>
			{/if}
		</div>
	{/if}
</div>
