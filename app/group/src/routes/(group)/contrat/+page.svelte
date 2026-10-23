<script lang="ts">
	import { page } from '$app/state';
	import { describeGroupBillingMode, formatEuros, vatRatePercent } from '@crystal-pharm/billing-db/domain';
	import {
		Alert,
		Button,
		Card,
		EmptyState,
		InvoiceTable,
		PageHeader,
		ProgressBar,
		StatCard,
		Tag,
		TextLink,
		type TagTone
	} from '@crystal-pharm/ui';
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
	const groupBilling = $derived({
		billingMode: data.contract?.billingMode ?? 'usage',
		flatRateMonthlyPriceCents: data.contract?.flatRateMonthlyPriceCents,
		pharmacyQuota: data.pharmacyQuota
	});
	const isPaidByCard = $derived(data.contract?.paymentMethod === 'card');
</script>

<svelte:head>
	<title>Contrat · {data.groupName}</title>
</svelte:head>

<PageHeader icon="receipt" title="Contrat" context="Ce que vous prenez en charge pour vos pharmacies, et ce que cela vous coûte." />

{#if paymentOutcome === 'reussi'}
	<Alert tone="success" title="Contrat activé">Vos pharmacies membres profitent dès maintenant de votre prise en charge.</Alert>
{:else if paymentOutcome === 'refuse'}
	<Alert tone="danger" title="Paiement refusé">Votre banque a refusé le paiement. Réessayez, ou contactez Crystal Pharm.</Alert>
{/if}
{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}

{#if !data.contract}
	<EmptyState icon="receipt" title="Pas encore de contrat" description="Crystal Pharm prépare votre contrat. Vous le retrouverez ici." />
{:else}
	{#if data.contract.status === 'awaiting_payment'}
		<Card>
			<form method="POST" action="?/payByCard" class="flex flex-wrap items-center justify-between gap-4">
				<div class="grid min-w-0 gap-1">
					<h2 class="title-2 text-ink">Activez votre contrat par carte</h2>
					<p class="text-body text-ink-muted">
						{#if data.firstPayment.totalCents > 0}
							Vous réglez aujourd’hui le premier mois : {formatEuros(data.firstPayment.subtotalCents)} HT
							+ {formatEuros(data.firstPayment.vatCents)} de TVA. Ensuite, votre carte est prélevée chaque mois, à la même date.
						{:else}
							Rien à payer aujourd’hui : vous n’avez pas encore de pharmacie qui utilise un module pris en charge.
						{/if}
					</p>
				</div>
				<Button type="submit" icon="credit-card">
					{data.firstPayment.totalCents > 0 ? `Payer ${formatEuros(data.firstPayment.totalCents)} TTC` : 'Activer le contrat'}
				</Button>
			</form>
		</Card>
	{:else if data.contract.status === 'suspended'}
		<Alert tone="danger" title="Contrat suspendu">Vos pharmacies ne profitent plus de votre prise en charge. Contactez Crystal Pharm.</Alert>
	{/if}

	<div class="grid gap-3.5 sm:grid-cols-3">
		<StatCard label="Statut" icon="seal-check" value={contractStatusTags[data.contract.status]?.label ?? ''}>
			{#snippet detail()}
				{isPaidByCard ? 'Payé par carte' : 'Sur facture, par virement'}
				{#if data.contract?.activatedAt} · depuis le {formatDay(data.contract.activatedAt)}{/if}
			{/snippet}
		</StatCard>
		<StatCard label="Votre coût mensuel" icon="receipt" value="{formatEuros(data.charge.monthlyTotalCents)} HT">
			{#snippet detail()}
				{#if data.contract?.billingMode === 'flat_rate'}
					Votre forfait{data.charge.overagePharmacyCount > 0
						? `, plus ${data.charge.overagePharmacyCount} pharmacie(s) au-delà`
						: ''}.
				{:else}
					Pour {data.memberPharmacyCount} pharmacie(s), d’après leurs modules actifs.
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
				{:else if data.contract?.status === 'awaiting_payment'}
					Dès l’activation de votre contrat.
				{:else}
					Aucune tant que le contrat est suspendu.
				{/if}
			{/snippet}
		</StatCard>
	</div>

	<Card>
		<div class="grid gap-3">
			<h2 class="title-2 text-ink">Comment vous êtes facturé</h2>
			<p class="body-strong text-ink">{describeGroupBillingMode(groupBilling)}.</p>
			{#if data.contract.billingMode === 'flat_rate'}
				<div class="grid gap-1.5">
					<ProgressBar label="Pharmacies dans votre forfait" value={data.memberPharmacyCount} maximum={data.pharmacyQuota} />
					<p class="text-small text-ink-muted">
						{data.memberPharmacyCount} pharmacie(s) membre(s) sur {data.pharmacyQuota} comprises. Au-delà, chaque pharmacie
						ajoute {formatEuros(data.charge.overageUnitPriceCents)} HT par mois : le prix du forfait divisé par {data.pharmacyQuota}.
					</p>
				</div>
				<p class="text-body text-ink-muted">
					Votre forfait couvre votre part de chaque module, quel que soit l’usage de vos pharmacies. Elles ne paient que ce qui
					reste à leur charge, dans la dernière colonne ci-dessous.
				</p>
			{:else}
				<p class="text-body text-ink-muted">
					Chaque mois, vous payez votre part des modules réellement actifs dans chacune de vos pharmacies (colonne « Vous payez »
					ci-dessous). Une pharmacie qui n’utilise rien ne vous coûte rien.
				</p>
			{/if}
			<p class="text-small text-ink-subtle">
				Prix hors taxes ; la TVA ({vatRatePercent} %) s’ajoute sur la facture.
				{isPaidByCard ? 'Votre carte est prélevée chaque mois, à la date anniversaire de l’activation.' : 'Une facture vous est envoyée chaque mois, à régler par virement.'}
			</p>
		</div>
	</Card>

	<section aria-labelledby="prise-en-charge-titre" class="grid gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<h2 id="prise-en-charge-titre" class="title-2 text-ink">Votre prise en charge, par pharmacie</h2>
			<Tag tone={contractStatusTags[data.contract.status]?.tone ?? 'neutral'}>{contractStatusTags[data.contract.status]?.label}</Tag>
		</div>
		<ContractToolTable catalog={data.catalog} coverages={data.contract.coverages} billingMode={data.contract.billingMode} />
		<div class="grid gap-1 text-small text-ink-muted">
			<p>
				<span class="body-strong text-ink">Comment se calcule un prix :</span> on part du prix catalogue, on retire votre remise ; sur
				ce prix remisé, votre part est pour vous, le reste pour la pharmacie.
			</p>
			<p>
				Une pharmacie qui prend tous les modules paie le pack, moins cher : votre prise en charge s’applique alors au prix du pack.
				Un module « actif d’office » est ouvert à chaque pharmacie dès son arrivée ; les autres, elle les active elle-même.
			</p>
			<p>Pour changer votre contrat ou votre quota, contactez Crystal Pharm.</p>
		</div>
	</section>

	{#if data.latestInvoices.length > 0}
		<section aria-labelledby="factures-titre" class="grid gap-2">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h2 id="factures-titre" class="title-2 text-ink">Dernières factures</h2>
				<TextLink href={groupPathnames.invoices}>Toutes vos factures</TextLink>
			</div>
			<InvoiceTable caption="Vos dernières factures" invoices={data.latestInvoices} />
		</section>
	{/if}
{/if}
