<script lang="ts">
	import { findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, Icon, PageHeader, PriceLabel, Tag } from '@crystal-pharm/ui';
	import { formatDay } from '../../dateFormats';
	import { homePathnames } from '../../homePathnames';
	import type { GroupInvitationActionFailure, GroupInvitationPageData } from './groupInvitationPageData';

	type GroupInvitationPageProps = {
		data: GroupInvitationPageData;
		form: GroupInvitationActionFailure | null | undefined;
	};

	let { data, form }: GroupInvitationPageProps = $props();

	const referenceField = $derived(
		'invitationToken' in data.invitationReference
			? { name: 'jeton', value: data.invitationReference.invitationToken }
			: { name: 'id', value: data.invitationReference.invitationId }
	);
	const canAccept = $derived(data.status === 'pending' && !data.currentGroupName);
	const unavailableMessages = {
		expired: 'Cette invitation a expiré. Demandez à votre groupement de vous en renvoyer une.',
		accepted: 'Vous avez déjà accepté cette invitation.',
		declined: 'Vous avez refusé cette invitation.',
		revoked: 'Le groupement a annulé cette invitation.'
	} as const;
</script>

<svelte:head>
	<title>Invitation de {data.groupName} · Crystal Pharm</title>
</svelte:head>

<div data-module="grp" class="contents">
	<PageHeader
		icon="buildings"
		title="{data.groupName} vous invite"
		context="Rejoignez son groupement sur Crystal Pharm. Rien ne change tant que vous n’avez pas accepté."
	/>
</div>

{#if data.status !== 'pending'}
	<Alert tone="warning">{unavailableMessages[data.status]}</Alert>
	<div><Button href={homePathnames.toolsHome} variant="secondary">Revenir à l’accueil</Button></div>
{:else}
	{#if data.currentGroupName}
		<Alert tone="warning" title="Déjà membre de {data.currentGroupName}">
			Une pharmacie fait partie d’un seul groupement à la fois. Quittez d’abord {data.currentGroupName} depuis
			<a href={homePathnames.pharmacyGroup} class="font-semibold underline">Pharmacie</a>.
		</Alert>
	{/if}
	{#if data.isAddressedToAnotherEmail}
		<Alert tone="info">
			Cette invitation était adressée à {data.invitedEmail}. En l’acceptant, c’est la pharmacie de ce compte qui rejoint {data.groupName}.
		</Alert>
	{/if}
	{#if !data.isContractActive}
		<Alert tone="info">Le contrat de {data.groupName} n’est pas encore actif : sa prise en charge commencera dès son activation.</Alert>
	{/if}

	<div class="grid items-start gap-3.5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<Card>
			<div class="grid gap-4">
				<h2 class="title-2 text-ink">Ce que vous y gagnez</h2>
				<table class="w-full text-body">
					<thead>
						<tr class="text-left text-small text-ink-muted">
							<th class="pb-2 font-medium">Module</th>
							<th class="pb-2 font-medium">Aujourd’hui</th>
							<th class="pb-2 font-medium">Avec {data.groupName}</th>
						</tr>
					</thead>
					<tbody>
						{#each data.offerRows as offerRow (offerRow.toolKey)}
							<tr class="border-t border-line-soft">
								<td class="py-2.5 body-strong">{offerRow.label}</td>
								<td class="py-2.5 text-ink-muted">{offerRow.isActiveToday ? 'Actif' : 'Non activé'}</td>
								<td class="py-2.5">
									{#if offerRow.isIncludedWithGroup}
										<Tag tone="success">Offert, actif dès l’adhésion</Tag>
									{:else if offerRow.coverageSummary}
										<PriceLabel
											amountLabel={formatEuros(offerRow.pharmacyPriceCents)}
											periodLabel="HT / mois"
											previousAmountLabel={formatEuros(offerRow.listPriceCents)}
										/>
									{:else}
										<span class="text-small text-ink-muted">Prix normal, {formatEuros(offerRow.listPriceCents)} HT / mois</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if data.currentMonthlyTotalCents > 0}
					<div class="flex flex-wrap items-center gap-2 rounded-md bg-success-soft px-3 py-2.5 text-body">
						<span>Vous payez aujourd’hui <strong class="tabular-nums">{formatEuros(data.currentMonthlyTotalCents)}</strong> HT par mois</span>
						<Icon name="arrow-right" size={16} />
						<span>avec {data.groupName} : <strong class="tabular-nums">{formatEuros(data.joinedMonthlyTotalCents)}</strong> HT</span>
					</div>
				{/if}
				{#if data.toolKeysNoLongerPaid.length > 0}
					<p class="text-small text-ink-muted">
						Vous ne paierez plus : {data.toolKeysNoLongerPaid.map((toolKey) => findTool(toolKey).label).join(', ')}.
						Votre abonnement est ajusté dès que vous acceptez.
					</p>
				{/if}
			</div>
		</Card>

		<Card>
			<div class="grid gap-3">
				<h2 class="title-2 text-ink">Ce que {data.groupName} verra</h2>
				<ul class="grid gap-2 text-body">
					<li class="flex gap-2"><Icon name="check" size={18} class="mt-px text-success" />Le nom et la ville de votre pharmacie</li>
					<li class="flex gap-2"><Icon name="check" size={18} class="mt-px text-success" />Les modules que vous utilisez</li>
					<li class="flex gap-2"><Icon name="x" size={18} class="mt-px text-danger" />Jamais vos patients, rendez-vous ni ordonnances</li>
					<li class="flex gap-2"><Icon name="x" size={18} class="mt-px text-danger" />Jamais votre équipe ni votre planning</li>
				</ul>
				<p class="text-small text-ink-muted">
					Vous pourrez quitter le groupement à tout moment depuis « Pharmacie » : sa prise en charge court alors jusqu’à la fin du mois.
					Invitation valable jusqu’au {formatDay(data.expiresAt)}.
				</p>
			</div>
		</Card>
	</div>

	{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}

	<form method="POST" class="flex flex-wrap items-center gap-2">
		<input type="hidden" name={referenceField.name} value={referenceField.value} />
		<Button type="submit" icon="check" formaction="?/accept" disabled={!canAccept}>Accepter et rejoindre {data.groupName}</Button>
		<ConfirmButton
			label="Refuser"
			variant="ghost"
			title="Refuser l’invitation de {data.groupName} ?"
			description="Le groupement saura que vous avez refusé. Il pourra vous inviter de nouveau plus tard."
			confirmLabel="Refuser"
			isDestructive
			formaction="?/decline"
		/>
	</form>
{/if}
