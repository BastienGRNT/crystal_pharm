<script lang="ts">
	import type { FlatRateOffer } from '@crystal-pharm/billing-db';
	import { parseEurosToCents, sellableToolKeys, type GroupBillingTerms, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, StepIndicator } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import GroupContractSummary from '$lib/components/organisms/GroupContractSummary.svelte';
	import {
		findStepOfField,
		groupFormSteps,
		toPreviewCoverages,
		type GroupFormErrors,
		type GroupFormFieldName,
		type GroupFormValues
	} from '$lib/groupForm/groupFormValues';
	import BillingStep from './BillingStep.svelte';
	import GroupDetailsStep from './GroupDetailsStep.svelte';
	import PaymentStep from './PaymentStep.svelte';
	import WhoPaysStep from './WhoPaysStep.svelte';

	type GroupFormProps = {
		initialValues: GroupFormValues;
		catalog: ToolCatalog;
		flatRateOffers: FlatRateOffer[];
		fieldErrors?: GroupFormErrors;
		isCreation: boolean;
		submitLabel: string;
		cancelHref: string;
	};

	let { initialValues, catalog, flatRateOffers, fieldErrors = {}, isCreation, submitLabel, cancelHref }: GroupFormProps = $props();

	const lastStepIndex = groupFormSteps.length - 1;
	const verificationStepIndex = lastStepIndex;

	// Le formulaire part des valeurs reçues puis vit sa vie : la page est rechargée après chaque envoi.
	let values = $state(untrack(() => structuredClone(initialValues)));
	// Refusé par le serveur : on rouvre l'étape à corriger.
	let currentStepIndex = $state(
		untrack(() => Math.min(lastStepIndex, ...Object.keys(fieldErrors).map((fieldName) => findStepOfField(fieldName as GroupFormFieldName))))
	);
	let stepErrors = $state<GroupFormErrors>({});
	let formElement: HTMLFormElement | undefined = $state();

	const shownErrors = $derived({ ...fieldErrors, ...stepErrors });
	const previewCoverages = $derived(toPreviewCoverages(values));
	const groupPaysNothing = $derived(values.whoPays === 'pharmacies');
	const billing: GroupBillingTerms = $derived({
		billingMode: groupPaysNothing ? 'usage' : values.billingMode,
		flatRateMonthlyPriceCents: parseEurosToCents(values.flatRatePrice),
		pharmacyQuota: Number(values.pharmacyQuota) || 0,
		billingPeriod: values.billingMode === 'flat_rate' ? values.billingPeriod : 'monthly',
		paymentMethod: values.paymentMethod,
		annualFreeMonths: catalog.annualFreeMonths
	});

	function goToStep(stepIndex: number): void {
		if (stepIndex > currentStepIndex && !isStepComplete(currentStepIndex)) return;
		currentStepIndex = stepIndex;
		formElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	// Les vérifications qui évitent d'aller plus loin pour rien ; le serveur vérifie tout de nouveau.
	function isStepComplete(stepIndex: number): boolean {
		stepErrors = {};
		if (stepIndex === 0) {
			if (!values.name.trim()) stepErrors.name = 'Indiquez le nom du groupement.';
			if (!/^\d+$/.test(values.pharmacyQuota.trim()) || Number(values.pharmacyQuota) < 1) {
				stepErrors.pharmacyQuota = 'Indiquez un nombre de pharmacies, par exemple 20.';
			}
		}
		if (stepIndex === 2 && !groupPaysNothing && values.billingMode === 'flat_rate' && parseEurosToCents(values.flatRatePrice) === undefined) {
			stepErrors.flatRatePrice = 'Indiquez le prix du forfait en euros HT, par exemple 2000.';
		}
		return Object.keys(stepErrors).length === 0;
	}

	function submitOnlyFromLastStep(event: SubmitEvent): void {
		if (!isCreation || currentStepIndex === lastStepIndex) return;
		event.preventDefault();
		goToStep(currentStepIndex + 1);
	}
</script>

<form method="POST" bind:this={formElement} onsubmit={submitOnlyFromLastStep} class="grid scroll-mt-20 gap-4">
	<!-- Ce qui part au serveur : les réponses telles qu'elles sont, quelle que soit l'étape affichée. -->
	<input type="hidden" name="name" value={values.name} />
	<input type="hidden" name="contactEmail" value={values.contactEmail} />
	<input type="hidden" name="pharmacyQuota" value={values.pharmacyQuota} />
	<input type="hidden" name="firstGroupMemberEmail" value={values.firstGroupMemberEmail} />
	<input type="hidden" name="whoPays" value={values.whoPays} />
	<input type="hidden" name="discountScope" value={values.discountScope} />
	<input type="hidden" name="discountPercent" value={values.discountPercent} />
	<input type="hidden" name="billingMode" value={values.billingMode} />
	<input type="hidden" name="flatRatePrice" value={values.flatRatePrice} />
	<input type="hidden" name="flatRateOfferId" value={values.flatRateOfferId} />
	<input type="hidden" name="paymentMethod" value={values.paymentMethod} />
	<input type="hidden" name="billingPeriod" value={values.billingPeriod} />
	{#each sellableToolKeys as toolKey (toolKey)}
		<input type="hidden" name="toolTerms.{toolKey}.payer" value={values.toolTerms[toolKey].payer} />
		<input type="hidden" name="toolTerms.{toolKey}.groupSharePercent" value={values.toolTerms[toolKey].groupSharePercent} />
		<input type="hidden" name="toolTerms.{toolKey}.discountPercent" value={values.toolTerms[toolKey].discountPercent} />
	{/each}

	<StepIndicator label="Étapes du contrat" steps={groupFormSteps} {currentStepIndex} />

	<div class="grid items-start gap-4 {currentStepIndex === verificationStepIndex ? '' : 'lg:grid-cols-[minmax(0,1fr)_360px]'}">
		<Card>
			<div class="grid gap-6">
				{#if currentStepIndex === 0}
					<GroupDetailsStep bind:values fieldErrors={shownErrors} {isCreation} />
				{:else if currentStepIndex === 1}
					<WhoPaysStep bind:values {catalog} fieldErrors={shownErrors} />
				{:else if currentStepIndex === 2}
					<BillingStep bind:values {catalog} coverages={previewCoverages} {flatRateOffers} fieldErrors={shownErrors} />
				{:else if currentStepIndex === 3}
					<PaymentStep bind:values annualFreeMonths={catalog.annualFreeMonths} fieldErrors={shownErrors} />
				{:else}
					<div class="grid gap-1">
						<h2 class="title-2 text-ink">{values.name || 'Le groupement'}, en clair</h2>
						<p class="text-small text-ink-muted">
							{values.pharmacyQuota} pharmacies prévues{values.contactEmail ? ` · ${values.contactEmail}` : ''}{isCreation &&
							values.firstGroupMemberEmail
								? ` · invitation envoyée à ${values.firstGroupMemberEmail}`
								: ''}. Relisez : c’est exactement ce que verront le groupement et ses pharmacies.
						</p>
					</div>
					<GroupContractSummary {catalog} coverages={previewCoverages} {billing} groupName={values.name} />
				{/if}

				{#if fieldErrors.form}<Alert tone="danger">{fieldErrors.form}</Alert>{/if}

				<div class="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4">
					<div class="flex flex-wrap gap-2">
						{#if currentStepIndex > 0}
							<Button variant="secondary" icon="caret-left" onclick={() => goToStep(currentStepIndex - 1)}>Précédent</Button>
						{:else}
							<Button href={cancelHref} variant="ghost">Annuler</Button>
						{/if}
					</div>
					<div class="flex flex-wrap gap-2">
						{#if !isCreation && currentStepIndex < lastStepIndex}
							<Button type="submit" variant="secondary" icon="check">{submitLabel}</Button>
						{/if}
						{#if currentStepIndex < lastStepIndex}
							<Button icon="arrow-right" onclick={() => goToStep(currentStepIndex + 1)}>Suivant</Button>
						{:else}
							<Button type="submit" icon="check">{submitLabel}</Button>
						{/if}
					</div>
				</div>
			</div>
		</Card>

		{#if currentStepIndex !== verificationStepIndex}
			<aside class="lg:sticky lg:top-[72px]">
				<Card>
					<div class="grid gap-3">
						<h2 class="title-2 text-ink">En résumé</h2>
						<GroupContractSummary {catalog} coverages={previewCoverages} {billing} groupName={values.name} />
					</div>
				</Card>
			</aside>
		{/if}
	</div>
</form>
