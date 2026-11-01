<script lang="ts">
	import {
		computeOverageUnitPrice,
		findIncludedToolKeys,
		findOfferLabel,
		findTool,
		formatEuros,
		parseEurosToCents,
		priceForPeriod,
		sellableToolKeys,
		tools
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, EmptyState, Field, IconButton, Input, PageHeader, PageTabs, StickyActionBar, Tag, UnitInput, type FilterTab } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failedPrices = $derived(form && 'failedSection' in form && form.failedSection === 'prices' ? form : undefined);
	const failedOffers = $derived(form && 'failedSection' in form && form.failedSection === 'flatRateOffers' ? form : undefined);
	const savedSection = $derived(form && 'savedSection' in form ? form.savedSection : undefined);

	const values = $state(untrack(() => structuredClone(failedPrices?.values ?? data.values)));
	const flatRateOfferInputs = $state(untrack(() => structuredClone(failedOffers?.flatRateOfferInputs ?? data.flatRateOfferInputs)));

	const sellableTools = tools.filter((tool) => sellableToolKeys.includes(tool.toolKey));

	const paidTotalCents = $derived(
		sellableTools.reduce((total, tool) => total + (parseEurosToCents(values.toolPriceInputs[tool.toolKey] ?? '') ?? 0), 0)
	);
	const packPriceCents = $derived(parseEurosToCents(values.packPriceInput));
	const packSavingPercent = $derived(
		packPriceCents !== undefined && paidTotalCents > 0 ? Math.round((1 - packPriceCents / paidTotalCents) * 100) : undefined
	);
	const annualFreeMonths = $derived(Number(values.annualFreeMonthsInput) || 0);
	const exampleMonthlyCents = $derived(packPriceCents ?? paidTotalCents);

	type PlanPreview = { planLabel: string; monthlyCents: number; isFeatured: boolean };
	// Ce que voit une pharmacie sans groupement : un module seul chacun, et le pack au milieu quand il fait économiser.
	const planPreviews = $derived.by((): PlanPreview[] => {
		const singlePlans = sellableTools
			.map((tool) => ({ planLabel: tool.label, monthlyCents: parseEurosToCents(values.toolPriceInputs[tool.toolKey] ?? '') ?? 0, isFeatured: false }))
			.filter((plan) => plan.monthlyCents > 0)
			.toSorted((first, second) => first.monthlyCents - second.monthlyCents);
		const isPackWorthShowing = packPriceCents !== undefined && singlePlans.length >= 2 && packPriceCents < paidTotalCents;
		if (!isPackWorthShowing) return singlePlans;
		const packPlan = { planLabel: singlePlans.map((plan) => plan.planLabel).join(' + '), monthlyCents: packPriceCents, isFeatured: true };
		const middleIndex = Math.floor(singlePlans.length / 2);
		return [...singlePlans.slice(0, middleIndex), packPlan, ...singlePlans.slice(middleIndex)];
	});

	function addFlatRateOffer(): void {
		flatRateOfferInputs.push({ offerId: '', label: '', pharmacyQuotaInput: '', priceInput: '' });
	}

	function computePricePerPlaceCents(pharmacyQuotaInput: string, priceInput: string): number | undefined {
		const pharmacyQuota = Number(pharmacyQuotaInput);
		const priceCents = parseEurosToCents(priceInput);
		if (!Number.isInteger(pharmacyQuota) || pharmacyQuota < 1 || priceCents === undefined) return undefined;
		return computeOverageUnitPrice(priceCents, pharmacyQuota);
	}

	type CatalogTab = 'pharmacyPrices' | 'groupFlatRates';
	const catalogTabHrefs: Record<CatalogTab, string> = { pharmacyPrices: '#prix', groupFlatRates: '#forfaits' };
	// Un envoi des forfaits (réussi ou refusé) rouvre leur onglet, pas celui des prix.
	let currentTab = $state<CatalogTab>(
		untrack(() => (failedOffers !== undefined || savedSection === 'flatRateOffers' ? 'groupFlatRates' : 'pharmacyPrices'))
	);
	const catalogTabs: FilterTab[] = $derived([
		{ label: 'Prix des pharmacies', href: catalogTabHrefs.pharmacyPrices, isCurrent: currentTab === 'pharmacyPrices', needsAttention: failedPrices !== undefined },
		{
			label: 'Forfaits de groupement',
			href: catalogTabHrefs.groupFlatRates,
			isCurrent: currentTab === 'groupFlatRates',
			count: flatRateOfferInputs.length,
			needsAttention: failedOffers !== undefined
		}
	]);

	function selectCatalogTab(href: string): void {
		const selectedTab = (Object.keys(catalogTabHrefs) as CatalogTab[]).find((tab) => catalogTabHrefs[tab] === href);
		if (selectedTab) currentTab = selectedTab;
	}

	const sectionTitleClasses = 'font-display text-[21px] leading-7 text-ink';
	const priceRowClasses = 'grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center';
</script>

<svelte:head>
	<title>Catalogue · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="package" title="Catalogue" context="Ce que paient les pharmacies seules, et les forfaits proposés aux groupements. Tous les prix sont HT.">
	{#snippet navigation()}<PageTabs label="Parties du catalogue" tabs={catalogTabs} onTabSelect={selectCatalogTab} />{/snippet}
</PageHeader>

{#if currentTab === 'pharmacyPrices'}
	<form method="POST" action="?/savePrices" class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
		<div class="grid gap-6">
			{#if savedSection === 'prices'}
				<Alert tone="success">Les prix sont enregistrés. Ils s’appliquent dès maintenant à l’aperçu et aux prochaines factures.</Alert>
			{/if}

			<section aria-labelledby="sold-tools-title" class="grid gap-3">
				<div class="grid gap-0.5">
					<h2 id="sold-tools-title" class={sectionTitleClasses}>Les modules vendus</h2>
					<p class="text-small text-ink-muted">Laissez vide un module qui n’est pas encore en vente ; à 0 €, il est gratuit pour toutes les pharmacies.</p>
				</div>
				<div class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
					{#each sellableTools as tool (tool.toolKey)}
						<div class={priceRowClasses}>
							<div class="grid min-w-0 gap-1">
								<p class="body-strong text-ink">{tool.label}</p>
								<p class="text-small text-ink-muted">{tool.pitch}</p>
								{#if findOfferLabel(tool.toolKey) !== tool.label}
									<p class="text-small text-ink-subtle">Vendu aux pharmacies sous le nom « {findOfferLabel(tool.toolKey)} ».</p>
								{/if}
								{#if findIncludedToolKeys(tool.toolKey).length > 0}
									<p class="flex flex-wrap gap-1.5">
										{#each findIncludedToolKeys(tool.toolKey) as includedToolKey (includedToolKey)}
											<Tag tone="success">{findTool(includedToolKey).label} compris</Tag>
										{/each}
									</p>
								{/if}
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
				</div>
			</section>

			<section aria-labelledby="formulas-title" class="grid gap-3">
				<h2 id="formulas-title" class={sectionTitleClasses}>Les formules</h2>
				<div class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
					<div class={priceRowClasses}>
						<div class="grid min-w-0 gap-1">
							<p class="body-strong text-ink">Le pack « tous les modules »</p>
							<p class="text-small text-ink-muted">
								La formule du milieu, pour une pharmacie sans groupement qui prend tous les modules vendus. Pris un par un :
								{formatEuros(paidTotalCents)} HT / mois.
								{#if packSavingPercent !== undefined && packSavingPercent > 0}Le pack fait économiser {packSavingPercent} %.{/if}
							</p>
							<p class="text-small text-ink-subtle">Pensez à le revoir quand un module est ajouté au catalogue.</p>
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
					<div class={priceRowClasses}>
						<div class="grid min-w-0 gap-1">
							<p class="body-strong text-ink">Le paiement à l’année</p>
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
				</div>
			</section>
		</div>

		<!-- L'aperçu suit la saisie, et le bouton reste à portée sans descendre. -->
		<aside aria-labelledby="plan-preview-title" class="grid gap-4 rounded-xl bg-rail p-5 text-on-rail shadow-float lg:sticky lg:top-6">
			<div class="grid gap-0.5">
				<p class="text-eyebrow text-accent-on-rail">Aperçu en direct</p>
				<h2 id="plan-preview-title" class="font-display text-[21px] leading-7">Ce que voient les pharmacies</h2>
				<p class="text-small text-rail-ink">De la moins chère à la plus chère ; le pack, au milieu, est mis en avant.</p>
			</div>
			{#if planPreviews.length === 0}
				<p class="rounded-lg border border-dashed border-rail-raised px-4 py-5 text-small text-rail-ink">Aucun module n’a de prix : rien n’est en vente.</p>
			{:else}
				<ul class="grid gap-2">
					{#each planPreviews as plan (plan.planLabel)}
						<li
							class="grid gap-0.5 rounded-lg px-4 py-3 {plan.isFeatured
								? 'bg-surface text-ink shadow-float'
								: 'border border-dashed border-rail-raised'}"
						>
							<span class="flex flex-wrap items-center justify-between gap-2">
								<span class="text-small font-bold">{plan.planLabel}</span>
								{#if plan.isFeatured}<Tag tone="accent">Recommandé</Tag>{/if}
							</span>
							<span class="font-display text-[24px] leading-8 tabular-nums">
								{formatEuros(plan.monthlyCents)} <span class="font-sans text-small {plan.isFeatured ? 'text-ink-muted' : 'text-rail-ink'}">HT / mois</span>
							</span>
							{#if annualFreeMonths > 0}
								<span class="text-small tabular-nums {plan.isFeatured ? 'text-ink-muted' : 'text-rail-ink'}">
									ou {formatEuros(priceForPeriod(plan.monthlyCents, 'yearly', annualFreeMonths))} HT / an
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<div class="grid gap-2 border-t-2 border-dashed border-rail-raised pt-4">
				<Button type="submit" icon="check">Enregistrer les prix</Button>
				<p class="text-small text-rail-ink">S’applique aux nouveaux abonnements : une pharmacie déjà abonnée garde son prix.</p>
			</div>
		</aside>
	</form>
{:else}
	<form method="POST" action="?/saveFlatRateOffers" class="grid gap-6">
		{#if savedSection === 'flatRateOffers'}
			<Alert tone="success">Les forfaits sont enregistrés. Un contrat déjà signé garde son prix.</Alert>
		{/if}

		<section aria-labelledby="flat-rates-title" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="flat-rates-title" class={sectionTitleClasses}>Les forfaits de groupement</h2>
				<p class="text-small text-ink-muted">
					Un prix fixe par mois pour un nombre de places. Au-delà, chaque pharmacie est facturée au prix d’une place du forfait.
				</p>
			</div>
			{#if flatRateOfferInputs.length === 0}
				<EmptyState icon="package" title="Aucun forfait" description="Ajoutez une offre : par exemple 200 pharmacies pour 2 000 € HT par mois." />
			{:else}
				<ul class="grid gap-3">
					{#each flatRateOfferInputs as offerInput, offerIndex (offerIndex)}
						{@const pricePerPlaceCents = computePricePerPlaceCents(offerInput.pharmacyQuotaInput, offerInput.priceInput)}
						<li class="grid overflow-hidden rounded-xl border border-line bg-surface shadow-card md:grid-cols-[minmax(0,1fr)_220px]">
							<div class="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_150px_170px] sm:items-start">
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
							</div>
							<div class="relative flex items-center justify-between gap-3 border-dashed border-line-strong/50 bg-accent-soft px-5 py-4 max-md:border-t-2 md:border-l-2">
								<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app max-md:hidden"></span>
								<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full border border-line bg-app max-md:hidden"></span>
								<p class="grid gap-0.5 text-accent-text">
									{#if pricePerPlaceCents !== undefined}
										<span class="font-display text-[28px] leading-8 tabular-nums">{formatEuros(pricePerPlaceCents)}</span>
										<span class="text-small">HT par place, et par pharmacie au-delà</span>
									{:else}
										<span class="text-small">Le prix d’une place s’affiche ici.</span>
									{/if}
								</p>
								<IconButton icon="trash" label="Retirer cette offre" onclick={() => flatRateOfferInputs.splice(offerIndex, 1)} />
							</div>
						</li>
					{/each}
				</ul>
			{/if}
			{#if failedOffers}<Alert tone="danger">{failedOffers.failureMessage}</Alert>{/if}
		</section>

		<StickyActionBar>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<Button variant="secondary" icon="plus" onclick={addFlatRateOffer}>Ajouter une offre</Button>
				<Button type="submit" icon="check">Enregistrer les forfaits</Button>
			</div>
		</StickyActionBar>
	</form>
{/if}
