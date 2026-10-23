<script lang="ts">
	import { page } from '$app/state';
	import { formatEuros, summarizeCoverage, tools } from '@crystal-pharm/billing-db/domain';
	import {
		Alert,
		Button,
		Card,
		ConfirmButton,
		DataTable,
		EmptyState,
		Field,
		Input,
		PageHeader,
		ProgressBar,
		StatCard,
		Tag
	} from '@crystal-pharm/ui';
	import ToolTags from '$lib/components/molecules/ToolTags.svelte';
	import { contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
	import { formatDay } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const contract = $derived(data.billing.contract);
	const usedPlaces = $derived(data.group.memberPharmacyCount + data.group.pendingInvitationCount);
	const invitationFailure = $derived(form && 'failedAction' in form ? form : undefined);
	const invitedEmail = $derived(
		form && 'succeededAction' in form && form.succeededAction === 'inviteGroupMember'
			? form.invitedEmail
			: page.url.searchParams.get('invite')
	);

	function describeToolCoverage(toolKey: string): string {
		const coverage = contract?.coverages.find((candidate) => candidate.toolKey === toolKey);
		return summarizeCoverage(coverage) ?? 'Prix normal';
	}
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
		<Button href="/groupements/{data.group.groupId}/modifier" variant="secondary" icon="pencil-simple">Modifier</Button>
	{/snippet}
</PageHeader>

{#if page.url.searchParams.has('cree')}
	<Alert tone="success" title="Groupement créé">
		{invitedEmail ? `L’invitation est partie à ${invitedEmail}.` : 'Invitez son premier responsable plus bas.'}
	</Alert>
{:else if page.url.searchParams.has('modifie')}
	<Alert tone="success">Le groupement et son contrat sont enregistrés.</Alert>
{:else if invitedEmail}
	<Alert tone="success">L’invitation est partie à {invitedEmail}.</Alert>
{/if}

<div class="grid gap-3.5 sm:grid-cols-3">
	<StatCard label="Places utilisées" icon="storefront" value="{usedPlaces} / {data.group.pharmacyQuota}">
		{#snippet detail()}
			<div class="grid gap-1.5">
				<ProgressBar label="Places utilisées" value={usedPlaces} maximum={data.group.pharmacyQuota} />
				{data.group.memberPharmacyCount} membres · {data.group.pendingInvitationCount} invitations en attente
			</div>
		{/snippet}
	</StatCard>
	<StatCard label="Coût mensuel pour le groupement" icon="receipt" value={formatEuros(data.billing.groupMonthlyCostCents)}>
		{#snippet detail()}D’après les modules actifs de ses pharmacies.{/snippet}
	</StatCard>
	<StatCard label="Responsables" icon="users-three" value={String(data.groupMembers.length)}>
		{#snippet detail()}{data.pendingGroupMemberInvitations.length} invitation(s) en attente{/snippet}
	</StatCard>
</div>

<Card>
	<div class="grid gap-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<h2 class="title-2 text-ink">Contrat</h2>
				{#if contract}
					<Tag tone={contractStatusLabels[contract.status].tone}>{contractStatusLabels[contract.status].label}</Tag>
					<span class="text-small text-ink-muted">{paymentMethodLabels[contract.paymentMethod]}</span>
				{/if}
			</div>
			{#if contract}
				<form method="POST" action="?/changeContractStatus" class="flex flex-wrap gap-2">
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
							label={contract.status === 'awaiting_payment' ? 'Marquer comme payé' : 'Réactiver'}
							icon="check-circle"
							variant="primary"
							title={contract.status === 'awaiting_payment' ? 'Activer sans paiement par carte ?' : 'Réactiver le contrat ?'}
							description="Les pharmacies membres retrouvent tout de suite les modules pris en charge."
							confirmLabel="Activer"
							name="status"
							value="active"
						/>
					{/if}
				</form>
			{/if}
		</div>
		<ul class="grid gap-2 sm:grid-cols-2">
			{#each tools as tool (tool.toolKey)}
				<li class="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-3 py-2">
					<span class="body-strong text-ink">{tool.label}</span>
					<span class="text-small text-ink-muted">{describeToolCoverage(tool.toolKey)}</span>
				</li>
			{/each}
		</ul>
	</div>
</Card>

<section aria-labelledby="pharmacies-title" class="grid gap-2">
	<h2 id="pharmacies-title" class="title-2 text-ink">Pharmacies membres</h2>
	{#if data.memberPharmacies.length === 0}
		<EmptyState
			icon="storefront"
			title="Aucune pharmacie membre"
			description="Les responsables du groupement invitent leurs pharmacies depuis leur espace."
		/>
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
					<td><ToolTags toolKeys={memberPharmacy.activeToolKeys} /></td>
					<td class="text-right tabular-nums">{formatEuros(memberPharmacy.groupMonthlyCostCents)}</td>
				</tr>
			{/each}
		</DataTable>
	{/if}
	{#if data.pendingPharmacyInvitations.length > 0}
		<p class="text-small text-ink-muted">
			En attente de réponse : {data.pendingPharmacyInvitations.map((invitation) => invitation.pharmacyName ?? invitation.email).join(', ')}.
		</p>
	{/if}
</section>

<Card>
	<div class="grid gap-4">
		<div class="grid gap-1">
			<h2 class="title-2 text-ink">Responsables du groupement</h2>
			<p class="text-small text-ink-muted">Ils se connectent à l’espace groupement pour inviter leurs pharmacies.</p>
		</div>
		{#if data.groupMembers.length > 0}
			<ul class="grid gap-1">
				{#each data.groupMembers as groupMember (groupMember.accountId)}
					<li class="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5">
						<span><span class="body-strong">{groupMember.name}</span> <span class="text-small text-ink-muted">· {groupMember.email}</span></span>
						<span class="text-small text-ink-subtle">depuis le {formatDay(groupMember.joinedAt)}</span>
					</li>
				{/each}
			</ul>
		{/if}
		{#each data.pendingGroupMemberInvitations as invitation (invitation.invitationId)}
			<form method="POST" action="?/revokeGroupMemberInvitation" class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-subtle px-3 py-2">
				<input type="hidden" name="invitationId" value={invitation.invitationId} />
				<span class="text-body">
					<Tag tone="warning">Invité</Tag>
					{invitation.email}
					<span class="text-small text-ink-muted">· expire le {formatDay(invitation.expiresAt)}</span>
				</span>
				<Button type="submit" variant="ghost" icon="x">Annuler l’invitation</Button>
			</form>
		{/each}
		<form method="POST" action="?/inviteGroupMember" class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
			<Field label="Inviter un responsable" errorMessage={invitationFailure?.failureMessage}>
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
	</div>
</Card>

{#if data.payments.length > 0}
	<section aria-labelledby="payments-title" class="grid gap-2">
		<h2 id="payments-title" class="title-2 text-ink">Paiements par carte</h2>
		<DataTable caption="Paiements du groupement">
			{#snippet head()}<th>Date</th><th>Libellé</th><th class="text-right">Montant</th>{/snippet}
			{#each data.payments as payment (payment.paymentId)}
				<tr>
					<td class="text-ink-muted">{formatDay(payment.paidAt)}</td>
					<td>{payment.description}</td>
					<td class="text-right tabular-nums">{formatEuros(payment.amountCents)}</td>
				</tr>
			{/each}
		</DataTable>
	</section>
{/if}
