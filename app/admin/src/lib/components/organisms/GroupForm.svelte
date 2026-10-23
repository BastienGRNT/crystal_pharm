<script lang="ts">
	import { tools, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ChoiceGroup, Field, Input, UnitInput } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import ToolCoverageRow from '$lib/components/molecules/ToolCoverageRow.svelte';
	import GroupContractPreview from '$lib/components/organisms/GroupContractPreview.svelte';
	import {
		coverageModeOptions,
		toPreviewCoverages,
		type CoverageMode,
		type GroupFormErrors,
		type GroupFormValues
	} from '$lib/groupForm/groupFormValues';

	type GroupFormProps = {
		initialValues: GroupFormValues;
		catalog: ToolCatalog;
		fieldErrors?: GroupFormErrors;
		isCreation: boolean;
		submitLabel: string;
		cancelHref: string;
	};

	let { initialValues, catalog, fieldErrors = {}, isCreation, submitLabel, cancelHref }: GroupFormProps = $props();

	// Le formulaire part des valeurs reçues puis vit sa vie : la page est rechargée après chaque envoi.
	const values = $state(untrack(() => structuredClone(initialValues)));
	const previewCoverages = $derived(toPreviewCoverages(values.coverages));

	const paymentMethodOptions = [
		{
			value: 'invoice',
			label: 'Sur facture',
			icon: 'receipt' as const,
			description: 'Actif dès la création. Crystal Pharm facture le groupement chaque mois.'
		},
		{
			value: 'card',
			label: 'Par carte',
			icon: 'credit-card' as const,
			description: 'Le groupement active son contrat en payant depuis son espace.'
		}
	];

	function applyModeToEveryTool(mode: CoverageMode): void {
		for (const coverage of Object.values(values.coverages)) coverage.mode = mode;
	}

	function findListPriceCents(toolKey: string): number | undefined {
		return catalog.toolPrices.find((toolPrice) => toolPrice.toolKey === toolKey)?.monthlyPriceCents;
	}
</script>

<form method="POST" class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
	<div class="grid gap-4">
		<Card>
			<div class="grid gap-4">
				<h2 class="title-2 text-ink">Le groupement</h2>
				<Field label="Nom du groupement" errorMessage={fieldErrors.name}>
					{#snippet control(controlAttributes)}
						<Input {...controlAttributes} name="name" required bind:value={values.name} />
					{/snippet}
				</Field>
				<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
					<Field label="Email de contact (facultatif)" hint="Pour la facturation et nos échanges." errorMessage={fieldErrors.contactEmail}>
						{#snippet control(controlAttributes)}
							<Input {...controlAttributes} type="email" name="contactEmail" bind:value={values.contactEmail} />
						{/snippet}
					</Field>
					<Field label="Quota" hint="Membres et invitations en attente." errorMessage={fieldErrors.pharmacyQuota}>
						{#snippet control(controlAttributes)}
							<UnitInput
								{...controlAttributes}
								name="pharmacyQuota"
								unit="pharmacies"
								inputmode="numeric"
								required
								bind:value={values.pharmacyQuota}
							/>
						{/snippet}
					</Field>
				</div>
			</div>
		</Card>

		<Card>
			<div class="grid gap-4">
				<div class="grid gap-1">
					<h2 class="title-2 text-ink">Le contrat</h2>
					<p class="text-small text-ink-muted">
						Module par module : offert (payé par le groupement), remisé, ou partagé entre le groupement et la pharmacie.
					</p>
				</div>
				<ChoiceGroup
					name="paymentMethod"
					legend="Comment le groupement paie"
					isLegendVisible
					layout="cards"
					options={paymentMethodOptions}
					bind:value={values.paymentMethod}
				/>
				{#if fieldErrors.paymentMethod}<p class="text-small font-medium text-danger">{fieldErrors.paymentMethod}</p>{/if}

				<div class="flex flex-wrap items-center gap-2 rounded-md bg-surface-subtle px-3 py-2">
					<span class="text-small text-ink-muted">Pour tous les modules :</span>
					{#each coverageModeOptions as option (option.value)}
						<button
							type="button"
							class="cursor-pointer rounded-xs px-2 py-1 text-[13px] font-semibold text-accent-text hover:bg-surface-muted"
							onclick={() => applyModeToEveryTool(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>

				<div>
					{#each tools as tool (tool.toolKey)}
						<ToolCoverageRow
							{tool}
							listPriceCents={findListPriceCents(tool.toolKey)}
							bind:coverage={values.coverages[tool.toolKey]}
							errorMessage={fieldErrors[tool.toolKey]}
						/>
					{/each}
				</div>
			</div>
		</Card>

		{#if isCreation}
			<Card>
				<div class="grid gap-4">
					<div class="grid gap-1">
						<h2 class="title-2 text-ink">Le premier responsable</h2>
						<p class="text-small text-ink-muted">
							Il reçoit un lien pour créer son compte groupement et inviter ses pharmacies. Vous pourrez en ajouter d’autres ensuite.
						</p>
					</div>
					<Field label="Son email (facultatif)" errorMessage={fieldErrors.firstGroupMemberEmail}>
						{#snippet control(controlAttributes)}
							<Input
								{...controlAttributes}
								type="email"
								name="firstGroupMemberEmail"
								placeholder="prenom.nom@groupement.fr"
								bind:value={values.firstGroupMemberEmail}
							/>
						{/snippet}
					</Field>
				</div>
			</Card>
		{/if}

		{#if fieldErrors.form}<Alert tone="danger">{fieldErrors.form}</Alert>{/if}

		<div class="flex flex-wrap items-center gap-2">
			<Button type="submit" icon="check">{submitLabel}</Button>
			<Button href={cancelHref} variant="ghost">Annuler</Button>
		</div>
	</div>

	<aside class="lg:sticky lg:top-[72px]">
		<Card>
			<GroupContractPreview {catalog} coverages={previewCoverages} />
		</Card>
	</aside>
</form>
