<script lang="ts">
	import type { FlatRateOffer } from '@crystal-pharm/billing-db';
	import { parseEurosToCents, sellableToolKeys, type GroupBillingTerms, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, StepIndicator } from '@crystal-pharm/ui';
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
	// Refusé par le serveur : on rouvre l'étape à corriger. Sinon, une création part du début et une modification de la vérification.
	let currentStepIndex = $state(untrack(() => findOpeningStepIndex()));
	let stepErrors = $state<GroupFormErrors>({});

	function findOpeningStepIndex(): number {
		const stepsWithErrors = Object.keys(fieldErrors).map((fieldName) => findStepOfField(fieldName as GroupFormFieldName));
		if (stepsWithErrors.length > 0) return Math.min(...stepsWithErrors);
		return isCreation ? 0 : verificationStepIndex;
	}
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

<form method="POST" bind:this={formElement} onsubmit={submitOnlyFromLastStep} class="grid scroll-mt-20 gap-6">
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

	<StepIndicator label="Étapes du contrat" steps={groupFormSteps} {currentStepIndex} onStepSelect={isCreation ? undefined : goToStep} />

	<div class="grid items-start gap-6 {currentStepIndex === verificationStepIndex ? '' : 'lg:grid-cols-[minmax(0,1fr)_380px]'}">
		<div class="rounded-xl border border-line bg-surface p-7 shadow-card max-sm:p-4">
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
						<h2 class="font-display text-[24px] leading-8 text-ink">{values.name || 'Le groupement'}, en clair</h2>
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

				<div class="flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-line-strong/40 pt-5">
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
		</div>

		{#if currentStepIndex !== verificationStepIndex}
			<!-- Le contrat se compose sous les yeux, comme un reçu qui s'imprime à chaque réponse. -->
			<aside aria-labelledby="group-form-summary-title" class="grid overflow-hidden rounded-xl border border-line bg-surface shadow-card lg:sticky lg:top-6">
				<div class="grid gap-0.5 bg-rail px-5 py-4 text-on-rail">
					<p class="text-eyebrow text-accent-on-rail">En résumé</p>
					<h2 id="group-form-summary-title" class="truncate font-display text-[21px] leading-7">{values.name || 'Le groupement'}</h2>
					{#if Number(values.pharmacyQuota) > 0}
						<p class="text-small text-rail-ink">{values.pharmacyQuota} pharmacies prévues</p>
					{/if}
				</div>
				<div class="relative border-t-2 border-dashed border-line-strong/40 p-5">
					<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
					<span aria-hidden="true" class="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-app"></span>
					<GroupContractSummary {catalog} coverages={previewCoverages} {billing} groupName={values.name} />
				</div>
			</aside>
		{/if}
	</div>
</form>
