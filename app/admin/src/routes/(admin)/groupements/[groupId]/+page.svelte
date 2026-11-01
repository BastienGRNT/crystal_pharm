<script lang="ts">
	import { page } from '$app/state';
	import { findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import {
		Alert,
		Avatar,
		Button,
		CapacityGrid,
		ConfirmButton,
		DataTable,
		EmptyState,
		Field,
		Input,
		InvoiceTable,
		PageHeader,
		PageTabs,
		Tag,
		TagList,
		TextLink,
		type FilterTab
	} from '@crystal-pharm/ui';
	import GroupContractSummary from '$lib/components/organisms/GroupContractSummary.svelte';
	import { contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
	import { formatDay } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const contract = $derived(data.billing.contract);
	const charge = $derived(data.billing.charge);
	const upcomingCharge = $derived(data.billing.upcomingCharge);
	const usedPlaces = $derived(data.group.memberPharmacyCount + data.group.pendingInvitationCount);
	const invitationFailure = $derived(form && 'failedAction' in form ? form : undefined);
	const invitedEmail = $derived(
		form && 'succeededAction' in form && form.succeededAction === 'inviteGroupMember'
			? form.invitedEmail
			: page.url.searchParams.get('invite')
	);

	type GroupDetailTab = 'overview' | 'pharmacies' | 'managers' | 'invoices';
	const tabSearchParameter = 'onglet';
	const tabSearchValues: Record<GroupDetailTab, string | undefined> = {
		overview: undefined,
		pharmacies: 'pharmacies',
		managers: 'responsables',
		invoices: 'factures'
	};

	const groupPathname = $derived(`/groupements/${data.group.groupId}`);
	const currentTab: GroupDetailTab = $derived(
		(Object.keys(tabSearchValues) as GroupDetailTab[]).find(
			(tab) => tabSearchValues[tab] !== undefined && tabSearchValues[tab] === page.url.searchParams.get(tabSearchParameter)
		) ?? 'overview'
	);

	function tabHref(tab: GroupDetailTab): string {
		const searchValue = tabSearchValues[tab];
		return searchValue ? `${groupPathname}?${tabSearchParameter}=${searchValue}` : groupPathname;
	}

	const dueInvoiceCount = $derived(data.invoices.filter((invoice) => invoice.isDue).length);
	const tabs: FilterTab[] = $derived([
		{ label: 'Vue d’ensemble', href: tabHref('overview'), isCurrent: currentTab === 'overview', needsAttention: contract?.status !== 'active' },
		{ label: 'Pharmacies', href: tabHref('pharmacies'), isCurrent: currentTab === 'pharmacies', count: data.memberPharmacies.length },
		{
			label: 'Responsables',
			href: tabHref('managers'),
			isCurrent: currentTab === 'managers',
			count: data.groupMembers.length,
			needsAttention: data.groupMembers.length === 0
		},
		{ label: 'Factures', href: tabHref('invoices'), isCurrent: currentTab === 'invoices', count: data.invoices.length, needsAttention: dueInvoiceCount > 0 }
	]);

	const placesSummary = $derived(
		`${data.group.memberPharmacyCount} pharmacies membres, ${data.group.pendingInvitationCount} invitées, ${data.group.pharmacyQuota} places`
	);
	const sectionTitleClasses = 'font-display text-[21px] leading-7 text-ink';
</script>

<svelte:head>
	<title>{data.group.name} · Crystal Pharm</title>
</svelte:head>

<PageHeader
	icon="buildings"
	title={data.group.name}
	context="Groupement créé le {formatDay(data.group.createdAt)}{data.group.contactEmail ? ` · ${data.group.contactEmail}` : ''}"
>
	{#snippet actions()}
		<Button href="{groupPathname}/modifier" variant="secondary" icon="pencil-simple">Modifier</Button>
	{/snippet}
	{#snippet navigation()}<PageTabs label="Parties de la fiche" {tabs} />{/snippet}
</PageHeader>

{#if page.url.searchParams.has('cree')}
	<Alert tone="success" title="Groupement créé">
		{#if invitedEmail}
			L’invitation est partie à {invitedEmail}.
		{:else}
			Invitez maintenant son premier responsable : <TextLink href={tabHref('managers')}>Responsables</TextLink>.
		{/if}
	</Alert>
{:else if page.url.searchParams.has('modifie')}
	<Alert tone="success">Le groupement et son contrat sont enregistrés.</Alert>
{:else if invitedEmail}
	<Alert tone="success">L’invitation est partie à {invitedEmail}.</Alert>
{/if}

{#if currentTab === 'overview'}
	<!-- Le contrat comme un ticket : ce que paie le groupement à gauche, la prochaine échéance et le geste qui change son état sur le talon. -->
	<section aria-label="Contrat" class="grid overflow-hidden rounded-xl bg-rail text-on-rail shadow-float lg:grid-cols-[minmax(0,1fr)_minmax(300px,auto)]">
		<div class="grid content-start gap-5 p-7 max-sm:p-5">
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-eyebrow text-accent-on-rail">Ce que paie le groupement</p>
				{#if contract}
					<Tag tone={contractStatusLabels[contract.status].tone}>{contractStatusLabels[contract.status].label}</Tag>
				{/if}
			</div>
			<div class="grid gap-1">
				<p class="font-display text-[52px] leading-[56px] tabular-nums max-sm:text-[40px] max-sm:leading-[44px]">
					{formatEuros(charge.monthlyTotalCents)} <span class="font-sans text-body text-rail-ink">HT / mois</span>
				</p>
				<p class="text-small text-rail-ink">
					{#if !contract}
						Pas encore de contrat.
					{:else if contract.billingMode === 'flat_rate'}
						Forfait {formatEuros(charge.flatRateCents)}{charge.overagePharmacyCount > 0
							? ` + ${charge.overagePharmacyCount} pharmacie${charge.overagePharmacyCount > 1 ? 's' : ''} au-delà du quota × ${formatEuros(charge.overageUnitPriceCents)}`
							: ''} · {paymentMethodLabels[contract.paymentMethod]}
					{:else}
						D’après les modules actifs de ses pharmacies · {paymentMethodLabels[contract.paymentMethod]}
					{/if}
				</p>
			</div>
			<div class="grid gap-2 border-t-2 border-dashed border-rail-raised pt-4">
				<p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="font-display text-[28px] leading-8 tabular-nums">{usedPlaces}<span class="text-rail-ink">&nbsp;/ {data.group.pharmacyQuota}</span></span>
					<span class="text-small text-rail-ink">
						places · {data.group.memberPharmacyCount} membre{data.group.memberPharmacyCount > 1 ? 's' : ''}, {data.group.pendingInvitationCount} invitation{data.group.pendingInvitationCount > 1 ? 's' : ''} en attente
					</span>
				</p>
				<CapacityGrid
					filledCount={data.group.memberPharmacyCount}
					pendingCount={data.group.pendingInvitationCount}
					capacity={data.group.pharmacyQuota}
					summary={placesSummary}
					surface="rail"
				/>
			</div>
		</div>
		<div class="relative grid content-center gap-4 border-dashed border-rail-raised p-7 max-lg:border-t-2 max-sm:p-5 lg:border-l-2">
			<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
			<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
			<div class="grid gap-1">
				<p class="text-eyebrow text-rail-ink">Prochaine échéance</p>
				{#if upcomingCharge}
					<p class="font-display text-[28px] leading-8">{formatDay(upcomingCharge.dueOn)}</p>
					<p class="text-body tabular-nums">
						{formatEuros(upcomingCharge.totalCents)} TTC
						<span class="text-small text-rail-ink">{upcomingCharge.billingPeriod === 'yearly' ? 'pour un an' : 'pour un mois'}</span>
					</p>
					<p class="text-small text-rail-ink">
						{contract?.paymentMethod === 'card' ? 'Prélevée sur la carte du groupement.' : 'Facture envoyée, à régler par virement.'}
					</p>
				{:else if contract?.status === 'awaiting_payment'}
					<p class="text-body">Au premier paiement par carte du groupement.</p>
				{:else if contract && !charge.monthlyTotalCents}
					<p class="text-body">Aucune : le groupement ne paie rien.</p>
				{:else if contract}
					<p class="text-body">Aucune tant que le contrat est suspendu.</p>
				{:else}
					<p class="text-body">Aucune.</p>
				{/if}
			</div>
			{#if contract}
				<form method="POST" action="?/changeContractStatus">
					{#if contract.status === 'active'}
						<ConfirmButton
							label="Suspendre"
							icon="lock-simple"
							title="Suspendre le contrat ?"
							description="Les pharmacies membres perdent tout de suite les modules pris en charge par le groupement. Vous pourrez le réactiver."
							confirmLabel="Suspendre"
							isDestructive
							name="status"
							value="suspended"
						/>
					{:else}
						<ConfirmButton
							label={contract.status === 'awaiting_payment' ? 'Activer sans attendre la carte' : 'Réactiver'}
							icon="check-circle"
							variant="primary"
							title={contract.status === 'awaiting_payment' ? 'Activer sans paiement par carte ?' : 'Réactiver le contrat ?'}
							description={contract.status === 'awaiting_payment'
								? 'Les pharmacies membres ont tout de suite les modules pris en charge. La facture du premier mois part aussitôt, à régler par virement.'
								: 'Les pharmacies membres retrouvent tout de suite les modules pris en charge.'}
							confirmLabel="Activer"
							name="status"
							value="active"
						/>
					{/if}
				</form>
			{:else}
				<Button href="{groupPathname}/modifier" icon="plus">Créer son contrat</Button>
			{/if}
		</div>
	</section>

	{#if contract}
		<section aria-labelledby="contract-terms-title" class="grid gap-3">
			<h2 id="contract-terms-title" class={sectionTitleClasses}>Le contrat, en clair</h2>
			<div class="rounded-xl border border-line bg-surface p-6 shadow-card max-sm:p-4">
				<GroupContractSummary
					catalog={data.billing.catalog}
					coverages={contract.coverages}
					billing={{
						billingMode: contract.billingMode,
						flatRateMonthlyPriceCents: contract.flatRateMonthlyPriceCents,
						pharmacyQuota: data.group.pharmacyQuota,
						billingPeriod: contract.billingPeriod,
						paymentMethod: contract.paymentMethod,
						annualFreeMonths: data.billing.catalog.annualFreeMonths
					}}
					groupName={data.group.name}
				/>
			</div>
		</section>
	{/if}
{:else if currentTab === 'pharmacies'}
	{#if data.memberPharmacies.length === 0}
		<EmptyState icon="storefront" title="Aucune pharmacie membre" description="Les responsables du groupement invitent leurs pharmacies depuis leur espace." />
	{:else}
		<DataTable caption="Pharmacies membres">
			{#snippet head()}
				<th>Pharmacie</th>
				<th>Membre depuis</th>
				<th>Modules actifs</th>
				<th class="text-right">Coût pour le groupement</th>
			{/snippet}
			{#each data.memberPharmacies as memberPharmacy (memberPharmacy.tenantId)}
				<tr>
					<td><span class="body-strong">{memberPharmacy.name}</span><br /><span class="text-small text-ink-muted">{memberPharmacy.city}</span></td>
					<td class="text-ink-muted">{formatDay(memberPharmacy.joinedAt)}</td>
					<td><TagList labels={memberPharmacy.activeToolKeys.map((toolKey) => findTool(toolKey).label)} emptyLabel="Aucun" /></td>
					<td class="text-right tabular-nums">{formatEuros(memberPharmacy.groupMonthlyCostCents)}</td>
				</tr>
			{/each}
		</DataTable>
	{/if}
	{#if data.pendingPharmacyInvitations.length > 0}
		<section aria-labelledby="pending-pharmacies-title" class="grid gap-3">
			<h2 id="pending-pharmacies-title" class={sectionTitleClasses}>En attente de réponse</h2>
			<ul class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.pendingPharmacyInvitations as invitation (invitation.invitationId)}
					<li class="flex min-w-0 items-center gap-3 rounded-lg border-2 border-dashed border-line-strong/50 px-4 py-3">
						<span aria-hidden="true" class="size-avatar flex-none rounded-full border-2 border-dashed border-line-strong"></span>
						<span class="min-w-0 truncate text-body text-ink">{invitation.pharmacyName ?? invitation.email}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{:else if currentTab === 'managers'}
	<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
		<section aria-labelledby="managers-title" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="managers-title" class={sectionTitleClasses}>Les responsables</h2>
				<p class="text-small text-ink-muted">Ils se connectent à l’espace groupement pour inviter leurs pharmacies.</p>
			</div>
			{#if data.groupMembers.length === 0 && data.pendingGroupMemberInvitations.length === 0}
				<EmptyState icon="users-three" title="Personne pour l’instant" description="Invitez le premier responsable : il recevra un lien par email." />
			{:else}
				<ul class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface px-5 shadow-card">
					{#each data.groupMembers as groupMember (groupMember.accountId)}
						<li class="flex flex-wrap items-center justify-between gap-3 py-3.5">
							<span class="flex min-w-0 items-center gap-3">
								<Avatar name={groupMember.name} />
								<span class="min-w-0">
									<span class="block body-strong text-ink">{groupMember.name}</span>
									<span class="block text-small text-ink-muted">{groupMember.email}</span>
								</span>
							</span>
							<span class="text-small text-ink-subtle">depuis le {formatDay(groupMember.joinedAt)}</span>
						</li>
					{/each}
					{#each data.pendingGroupMemberInvitations as invitation (invitation.invitationId)}
						<li class="flex flex-wrap items-center justify-between gap-3 py-3.5">
							<span class="flex min-w-0 items-center gap-3">
								<span aria-hidden="true" class="size-avatar flex-none rounded-full border-2 border-dashed border-line-strong"></span>
								<span class="min-w-0">
									<span class="flex items-center gap-2 body-strong text-ink">{invitation.email} <Tag tone="warning">Invité</Tag></span>
									<span class="block text-small text-ink-muted">L’invitation expire le {formatDay(invitation.expiresAt)}</span>
								</span>
							</span>
							<form method="POST" action="?{tabSearchParameter}={tabSearchValues.managers}&/revokeGroupMemberInvitation">
								<input type="hidden" name="invitationId" value={invitation.invitationId} />
								<Button type="submit" variant="ghost" size="compact" icon="x">Annuler</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<aside aria-labelledby="invite-manager-title" class="grid gap-3 rounded-xl border border-line bg-accent-soft p-5 lg:sticky lg:top-6">
			<div class="grid gap-0.5">
				<h2 id="invite-manager-title" class={sectionTitleClasses}>Inviter un responsable</h2>
				<p class="text-small text-ink-muted">Il reçoit un lien par email et crée son compte.</p>
			</div>
			<form method="POST" action="?{tabSearchParameter}={tabSearchValues.managers}&/inviteGroupMember" class="grid gap-3">
				<Field label="Son email" errorMessage={invitationFailure?.failureMessage}>
					{#snippet control(controlAttributes)}
						<Input
							{...controlAttributes}
							type="email"
							name="email"
							required
							placeholder="prenom.nom@groupement.fr"
							value={invitationFailure?.submittedEmail ?? ''}
						/>
					{/snippet}
				</Field>
				<Button type="submit" icon="paper-plane-tilt">Envoyer l’invitation</Button>
			</form>
		</aside>
	</div>
{:else}
	{#if data.invoices.length === 0}
		<EmptyState icon="file-text" title="Aucune facture pour l’instant" description="La première part au premier paiement du groupement, puis une chaque mois." />
	{:else}
		<InvoiceTable caption="Factures du groupement" invoices={data.invoices}>
			{#snippet rowActions(invoice)}
				{#if invoice.isDue}
					<form method="POST" action="/factures?/markPaid">
						<input type="hidden" name="invoiceId" value={invoice.invoiceId} />
						<input type="hidden" name="invoiceNumber" value={invoice.number} />
						<ConfirmButton
							label="Marquer comme payée"
							icon="check-circle"
							variant="ghost"
							title="Le virement de {invoice.totalLabel} est arrivé ?"
							description="La facture {invoice.number} passe en « Payée ». À faire seulement une fois le virement reçu sur le compte."
							confirmLabel="Marquer comme payée"
						/>
					</form>
				{/if}
			{/snippet}
		</InvoiceTable>
	{/if}
{/if}
