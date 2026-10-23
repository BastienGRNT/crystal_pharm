<script lang="ts">
	import {
		computeOverageUnitPrice,
		describeInclusion,
		formatEuros,
		parseEurosToCents,
		priceForPeriod,
		sellableToolKeys,
		tools
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, EmptyState, Field, IconButton, Input, PageHeader, Tag, UnitInput } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failedPrices = $derived(form && 'failedSection' in form && form.failedSection === 'prices' ? form : undefined);
	const failedOffers = $derived(form && 'failedSection' in form && form.failedSection === 'flatRateOffers' ? form : undefined);
	const savedSection = $derived(form && 'savedSection' in form ? form.savedSection : undefined);

	const values = $state(untrack(() => structuredClone(failedPrices?.values ?? data.values)));
	const flatRateOfferInputs = $state(untrack(() => structuredClone(failedOffers?.flatRateOfferInputs ?? data.flatRateOfferInputs)));

	const sellableTools = tools.filter((tool) => sellableToolKeys.includes(tool.toolKey));
	const includedTools = tools.filter((tool) => !sellableToolKeys.includes(tool.toolKey));

	const paidTotalCents = $derived(
		sellableTools.reduce((total, tool) => total + (parseEurosToCents(values.toolPriceInputs[tool.toolKey] ?? '') ?? 0), 0)
	);
	const packPriceCents = $derived(parseEurosToCents(values.packPriceInput));
	const packSavingPercent = $derived(
		packPriceCents !== undefined && paidTotalCents > 0 ? Math.round((1 - packPriceCents / paidTotalCents) * 100) : undefined
	);
	const annualFreeMonths = $derived(Number(values.annualFreeMonthsInput) || 0);
	const exampleMonthlyCents = $derived(packPriceCents ?? paidTotalCents);

	function addFlatRateOffer(): void {
		flatRateOfferInputs.push({ offerId: '', label: '', pharmacyQuotaInput: '', priceInput: '' });
	}

	function describePricePerPharmacy(pharmacyQuotaInput: string, priceInput: string): string | undefined {
		const pharmacyQuota = Number(pharmacyQuotaInput);
		const priceCents = parseEurosToCents(priceInput);
		if (!Number.isInteger(pharmacyQuota) || pharmacyQuota < 1 || priceCents === undefined) return undefined;
		return `soit ${formatEuros(computeOverageUnitPrice(priceCents, pharmacyQuota))} HT par pharmacie, et par pharmacie au-delà`;
	}
</script>

<svelte:head>
	<title>Catalogue · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="package" title="Catalogue" context="Les prix des modules, du pack et du paiement à l’année, et les forfaits des groupements. Tous les prix sont HT." />

<form method="POST" action="?/savePrices" class="grid max-w-[760px] gap-3.5">
	{#if savedSection === 'prices'}
		<Alert tone="success">Les prix sont enregistrés. Ils s’appliquent dès maintenant à l’aperçu et aux prochaines factures.</Alert>
	{/if}

	<Card>
		<div class="grid gap-1">
			<h2 class="title-2 text-ink">Les modules vendus</h2>
			<p class="text-small text-ink-muted">Laissez vide un module qui n’est pas encore en vente ; à 0 €, il est gratuit pour toutes les pharmacies.</p>
		</div>
		<div class="mt-2">
			{#each sellableTools as tool (tool.toolKey)}
				<div class="grid gap-3 border-t border-line-soft py-4 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
					<div class="min-w-0">
						<p class="body-strong text-ink">{tool.label}</p>
						<p class="text-small text-ink-muted">{tool.pitch}</p>
					</div>
					<Field label="Prix de {tool.label}" errorMessage={failedPrices?.fieldErrors[tool.toolKey]}>
						{#snippet control(controlAttributes)}
							<UnitInput
								{...controlAttributes}
								name={tool.toolKey}
								unit="€ HT / mois"
								inputmode="decimal"
								placeholder="Pas en vente"
								bind:value={values.toolPriceInputs[tool.toolKey]}
							/>
						{/snippet}
					</Field>
				</div>
			{/each}
			{#each includedTools as tool (tool.toolKey)}
				<div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-4">
					<div class="min-w-0">
						<p class="body-strong text-ink">{tool.label}</p>
						<p class="text-small text-ink-muted">{tool.pitch}</p>
					</div>
					<Tag tone="success">{describeInclusion(tool.toolKey)}</Tag>
				</div>
			{/each}
		</div>
	</Card>

	<Card>
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
			<div class="min-w-0">
				<h2 class="title-2 text-ink">Le pack « tous les modules »</h2>
				<p class="text-small text-ink-muted">
					Pour une pharmacie sans groupement qui prend tous les modules vendus. Pris un par un : {formatEuros(paidTotalCents)} HT / mois.
					{#if packSavingPercent !== undefined && packSavingPercent > 0}Le pack fait économiser {packSavingPercent} %.{/if}
				</p>
				<p class="mt-1 text-small text-ink-subtle">Pensez à le revoir quand un module est ajouté au catalogue.</p>
			</div>
			<Field label="Prix du pack" errorMessage={failedPrices?.fieldErrors.pack}>
				{#snippet control(controlAttributes)}
					<UnitInput
						{...controlAttributes}
						name="pack"
						unit="€ HT / mois"
						inputmode="decimal"
						placeholder="Pas de pack"
						bind:value={values.packPriceInput}
					/>
				{/snippet}
			</Field>
		</div>
	</Card>

	<Card>
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
			<div class="min-w-0">
				<h2 class="title-2 text-ink">Le paiement à l’année</h2>
				<p class="text-small text-ink-muted">
					Payé d’un coup pour douze mois, ces mois-là sont offerts, pour les pharmacies comme pour les forfaits des groupements.
					{#if exampleMonthlyCents > 0 && annualFreeMonths > 0}
						Par exemple, {formatEuros(exampleMonthlyCents)} par mois devient {formatEuros(priceForPeriod(exampleMonthlyCents, 'yearly', annualFreeMonths))} par an.
					{/if}
				</p>
			</div>
			<Field label="Mois offerts" errorMessage={failedPrices?.fieldErrors.annualFreeMonths}>
				{#snippet control(controlAttributes)}
					<UnitInput {...controlAttributes} name="annualFreeMonths" unit="mois" inputmode="numeric" bind:value={values.annualFreeMonthsInput} />
				{/snippet}
			</Field>
		</div>
	</Card>

	<div><Button type="submit" icon="check">Enregistrer les prix</Button></div>
</form>

<form method="POST" action="?/saveFlatRateOffers" class="mt-4 grid max-w-[760px] gap-3.5">
	{#if savedSection === 'flatRateOffers'}
		<Alert tone="success">Les forfaits sont enregistrés. Un contrat déjà signé garde son prix.</Alert>
	{/if}
	<Card>
		<div class="grid gap-4">
			<div class="grid gap-1">
				<h2 class="title-2 text-ink">Les forfaits de groupement</h2>
				<p class="text-small text-ink-muted">
					Un prix fixe par mois pour un nombre de places. Au-delà, chaque pharmacie est facturée au prix d’une place du forfait.
				</p>
			</div>
			{#if flatRateOfferInputs.length === 0}
				<EmptyState icon="package" title="Aucun forfait" description="Ajoutez une offre : par exemple 200 pharmacies pour 2 000 € HT par mois." />
			{/if}
			{#each flatRateOfferInputs as offerInput, offerIndex (offerIndex)}
				<div class="grid gap-3 border-t border-line-soft pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_150px_170px_auto] sm:items-end">
					<input type="hidden" name="offerId" value={offerInput.offerId} />
					<Field label="Nom de l’offre">
						{#snippet control(controlAttributes)}
							<Input {...controlAttributes} name="offerLabel" placeholder="Réseau 200" bind:value={offerInput.label} />
						{/snippet}
					</Field>
					<Field label="Places">
						{#snippet control(controlAttributes)}
							<UnitInput {...controlAttributes} name="offerQuota" unit="pharmacies" inputmode="numeric" bind:value={offerInput.pharmacyQuotaInput} />
						{/snippet}
					</Field>
					<Field label="Prix">
						{#snippet control(controlAttributes)}
							<UnitInput {...controlAttributes} name="offerPrice" unit="€ HT / mois" inputmode="decimal" bind:value={offerInput.priceInput} />
						{/snippet}
					</Field>
					<IconButton icon="trash" label="Retirer cette offre" onclick={() => flatRateOfferInputs.splice(offerIndex, 1)} />
					{#if describePricePerPharmacy(offerInput.pharmacyQuotaInput, offerInput.priceInput)}
						<p class="text-small text-ink-muted sm:col-span-4">{describePricePerPharmacy(offerInput.pharmacyQuotaInput, offerInput.priceInput)}.</p>
					{/if}
				</div>
			{/each}
			{#if failedOffers}<Alert tone="danger">{failedOffers.failureMessage}</Alert>{/if}
			<div class="flex flex-wrap gap-2">
				<Button variant="secondary" icon="plus" onclick={addFlatRateOffer}>Ajouter une offre</Button>
				<Button type="submit" icon="check">Enregistrer les forfaits</Button>
			</div>
		</div>
	</Card>
</form>
