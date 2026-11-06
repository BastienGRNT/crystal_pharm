<script lang="ts">
	import { Alert, Avatar, Button, Field, FormSection, Input, PageHeader, Tag } from '@crystal-pharm/ui';
	import GroupSectionTabs from '$lib/components/molecules/GroupSectionTabs.svelte';
	import { formatDay, formatDaysUntil } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const invitationFailure = $derived(form && 'failedAction' in form ? form : undefined);
	const invitedEmail = $derived(form && 'succeededAction' in form && form.succeededAction === 'inviteColleague' ? form.invitedEmail : undefined);
</script>

<svelte:head>
	<title>Équipe · Crystal Pharm</title>
</svelte:head>

<div class="grid gap-8">
	<PageHeader icon="buildings" title="Mon groupement" context="Les personnes qui gèrent l’espace de votre groupement.">
		{#snippet navigation()}<GroupSectionTabs isContractAwaitingPayment={data.isContractAwaitingPayment} />{/snippet}
	</PageHeader>

	{#if invitedEmail}<Alert tone="success">L’invitation est partie à {invitedEmail}.</Alert>{/if}

	<FormSection title="L’équipe" description="Chacun peut inviter des pharmacies et suivre votre contrat.">
		<ul class="grid divide-y divide-dashed divide-line-strong/40">
			{#each data.groupMembers as groupMember (groupMember.accountId)}
				<li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
					<span class="flex min-w-0 items-center gap-3">
						<Avatar name={groupMember.name} />
						<span class="min-w-0">
							<span class="flex items-center gap-2 body-strong">
								{groupMember.name}
								{#if groupMember.accountId === data.signedInAccountId}<Tag tone="accent">Vous</Tag>{/if}
							</span>
							<span class="block text-small text-ink-muted">{groupMember.email}</span>
						</span>
					</span>
					<span class="text-small text-ink-subtle">depuis le {formatDay(groupMember.joinedAt)}</span>
				</li>
			{/each}
			{#each data.pendingInvitations as invitation (invitation.invitationId)}
				<li class="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
					<span class="flex min-w-0 items-center gap-3">
						<span aria-hidden="true" class="size-avatar flex-none rounded-full border-2 border-dashed border-line-strong"></span>
						<span class="min-w-0">
							<span class="flex items-center gap-2 body-strong">{invitation.email} <Tag tone="warning">Invité</Tag></span>
							<span class="block text-small text-ink-muted">L’invitation expire {formatDaysUntil(invitation.expiresAt)}</span>
						</span>
					</span>
					<form method="POST" action="?/revokeInvitation">
						<input type="hidden" name="invitationId" value={invitation.invitationId} />
						<Button type="submit" variant="ghost" size="compact" icon="x">Annuler</Button>
					</form>
				</li>
			{/each}
		</ul>
	</FormSection>

	<FormSection title="Inviter un collègue" description="Il reçoit un lien par email et crée son compte en une minute.">
		<form method="POST" action="?/inviteColleague" class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
	</FormSection>
</div>
