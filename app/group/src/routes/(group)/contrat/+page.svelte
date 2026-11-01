<script lang="ts">
	import { page } from '$app/state';
	import {
		describeGroupContractInWords,
		describeFreeMonths,
		describeGroupContractTerms,
		formatEuros,
		priceForPeriod
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, EmptyState, Icon, InvoiceTable, PageHeader, StatCard, TextLink, type TagTone } from '@crystal-pharm/ui';
	import GroupSectionTabs from '$lib/components/molecules/GroupSectionTabs.svelte';
	import ContractToolTable from '$lib/components/organisms/ContractToolTable.svelte';
	import { formatDay, formatDaysUntil } from '$lib/dateFormats';
	import { groupPathnames } from '$lib/groupPathnames';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const paymentOutcome = $derived(page.url.searchParams.get('paiement'));
	const contractStatusTags: Record<string, { label: string; tone: TagTone }> = {
		active: { label: 'Actif', tone: 'success' },
		awaiting_payment: { label: 'À activer', tone: 'warning' },
		suspended: { label: 'Suspendu', tone: 'danger' }
	};
	const contract = $derived(data.contract);
	const isPaidByCard = $derived(contract?.paymentMethod === 'card');
	const isYearly = $derived(contract?.billingPeriod === 'yearly');
	const words = $derived(
		contract &&
			describeGroupContractInWords(
				describeGroupContractTerms(data.catalog, contract.coverages),
				{
					billingMode: contract.billingMode,
					flatRateMonthlyPriceCents: contract.flatRateMonthlyPriceCents,
					pharmacyQuota: data.pharmacyQuota,
					billingPeriod: contract.billingPeriod,
					paymentMethod: contract.paymentMethod,
					annualFreeMonths: data.catalog.annualFreeMonths
				},
				{ groupName: data.groupName, isAddressedToGroup: true }
			)
	);
</script>

<svelte:head>
	<title>Contrat · {data.groupName}</title>
</svelte:head>

<PageHeader icon="buildings" title="Mon groupement" context="Ce que vous offrez à vos pharmacies, et ce que cela vous coûte.">
	{#snippet navigation()}<GroupSectionTabs isContractAwaitingPayment={data.isContractAwaitingPayment} />{/snippet}
</PageHeader>

{#if paymentOutcome === 'reussi'}
	<Alert tone="success" title="Contrat activé">Vos pharmacies membres profitent dès maintenant de votre prise en charge.</Alert>
{:else if paymentOutcome === 'refuse'}
	<Alert tone="danger" title="Paiement refusé">Votre banque a refusé le paiement. Réessayez, ou contactez Crystal Pharm.</Alert>
{/if}
{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}

{#if !contract || !words}
	<EmptyState icon="receipt" title="Pas encore de contrat" description="Crystal Pharm prépare votre contrat. Vous le retrouverez ici." />
{:else}
	{#if contract.status === 'awaiting_payment'}
		<!-- Le ticket à valider : ce qu'on paie aujourd'hui en gros, le bouton juste à côté. -->
		<form method="POST" action="?/payByCard" class="grid overflow-hidden rounded-xl bg-rail text-on-rail shadow-float md:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2 p-6">
				<p class="text-eyebrow text-warning-on-rail">À activer</p>
				<h2 class="font-display text-[26px] leading-8">Activez votre contrat</h2>
				<p class="max-w-xl text-body text-rail-ink">
					{#if data.firstPayment.totalCents > 0}
						Vous réglez aujourd’hui {isYearly ? 'votre première année' : 'votre premier mois'} :
						{formatEuros(data.firstPayment.subtotalCents)} HT + {formatEuros(data.firstPayment.vatCents)} de TVA.
						Ensuite, votre carte est prélevée {isYearly ? 'chaque année' : 'chaque mois'}, à la même date.
					{:else}
						Rien à payer aujourd’hui : aucune de vos pharmacies n’utilise encore un module que vous prenez en charge.
					{/if}
				</p>
			</div>
			<div class="relative grid content-center justify-items-start gap-3 border-dashed border-rail-raised p-6 max-md:border-t-2 md:border-l-2">
				<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full bg-app max-md:hidden"></span>
				<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full bg-app max-md:hidden"></span>
				{#if data.firstPayment.totalCents > 0}
					<p class="font-display text-[36px] leading-10 tabular-nums">{formatEuros(data.firstPayment.totalCents)} <span class="text-small font-sans text-rail-ink">TTC</span></p>
				{/if}
				<Button type="submit" icon="credit-card">
					{data.firstPayment.totalCents > 0 ? 'Payer par carte' : 'Activer le contrat'}
				</Button>
			</div>
		</form>
	{:else if contract.status === 'suspended'}
		<Alert tone="danger" title="Contrat suspendu">Vos pharmacies ne profitent plus de votre prise en charge. Contactez Crystal Pharm.</Alert>
	{/if}

	<div class="grid gap-3.5 sm:grid-cols-3">
		<StatCard label="Statut" icon="seal-check" value={contractStatusTags[contract.status]?.label ?? ''}>
			{#snippet detail()}
				{isPaidByCard ? 'Par carte' : 'Par virement'}, {isYearly ? 'à l’année' : 'chaque mois'}
				{#if contract?.activatedAt} · depuis le {formatDay(contract.activatedAt)}{/if}
			{/snippet}
		</StatCard>
		<StatCard label="Votre coût" icon="receipt" value="{formatEuros(data.charge.monthlyTotalCents)} HT / mois">
			{#snippet detail()}
				{#if isYearly}
					Soit {formatEuros(priceForPeriod(data.charge.monthlyTotalCents, 'yearly', data.catalog.annualFreeMonths))} HT par an,
					{describeFreeMonths(data.catalog.annualFreeMonths)}.
				{:else if contract?.billingMode === 'flat_rate'}
					Votre forfait{data.charge.overagePharmacyCount > 0 ? `, plus ${data.charge.overagePharmacyCount} pharmacie${data.charge.overagePharmacyCount > 1 ? 's' : ''} au-delà` : ''}.
				{:else}
					Pour vos {data.memberPharmacyCount} pharmacie{data.memberPharmacyCount > 1 ? 's' : ''}, d’après ce qu’elles utilisent.
				{/if}
			{/snippet}
		</StatCard>
		<StatCard
			label={isPaidByCard ? 'Prochain prélèvement' : 'Prochaine facture'}
			icon="calendar-check"
			value={data.upcomingCharge ? formatDay(data.upcomingCharge.dueOn) : '—'}
		>
			{#snippet detail()}
				{#if data.upcomingCharge}
					{formatEuros(data.upcomingCharge.totalCents)} TTC, {formatDaysUntil(data.upcomingCharge.dueOn)} ·
					<a href={groupPathnames.invoices} class="text-accent-text underline">vos factures</a>
				{:else if contract?.status === 'awaiting_payment'}
					Dès l’activation de votre contrat.
				{:else if data.charge.monthlyTotalCents === 0}
					Rien à payer pour l’instant.
				{:else}
					Aucune tant que le contrat est suspendu.
				{/if}
			{/snippet}
		</StatCard>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
			<section class="grid content-start gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
				<h2 class="flex items-center gap-2 font-display text-[21px] leading-7 text-ink"><Icon name="storefront" size={20} class="text-accent-text" />Pour vos pharmacies</h2>
				<ul class="grid gap-2 text-body text-ink">
					{#each words.forPharmacies as sentence (sentence)}<li>{sentence}</li>{/each}
				</ul>
			</section>
			<section class="grid content-start gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
				<h2 class="flex items-center gap-2 font-display text-[21px] leading-7 text-ink"><Icon name="receipt" size={20} class="text-accent-text" />Pour vous</h2>
				<ul class="grid gap-2 text-body text-ink">
					{#each words.forGroup as sentence (sentence)}<li>{sentence}</li>{/each}
				</ul>
				<p class="border-t border-dashed border-line-strong/50 pt-3 text-small text-ink-subtle">Prix hors taxes, TVA en plus sur la facture.</p>
			</section>
	</div>

	<section aria-labelledby="par-pharmacie-titre" class="grid gap-2">
		<h2 id="par-pharmacie-titre" class="font-display text-[21px] leading-7 text-ink">Le détail, pour une pharmacie membre</h2>
		<ContractToolTable catalog={data.catalog} coverages={contract.coverages} billingMode={contract.billingMode} />
		<p class="text-small text-ink-muted">Pour changer votre contrat ou votre nombre de pharmacies, contactez Crystal Pharm.</p>
	</section>

	{#if data.latestInvoices.length > 0}
		<section aria-labelledby="factures-titre" class="grid gap-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 id="factures-titre" class="font-display text-[21px] leading-7 text-ink">Dernières factures</h2>
				<TextLink href={groupPathnames.invoices}>Toutes vos factures</TextLink>
			</div>
			<InvoiceTable caption="Vos dernières factures" invoices={data.latestInvoices} />
		</section>
	{/if}
{/if}
