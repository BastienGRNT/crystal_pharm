<script lang="ts">
	import { Alert, Avatar, Button, Card, Field, Input, PageHeader, Tag } from '@crystal-pharm/ui';
	import { formatDay, formatDaysUntil } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const invitationFailure = $derived(form && 'failedAction' in form ? form : undefined);
	const invitedEmail = $derived(form && 'succeededAction' in form && form.succeededAction === 'inviteColleague' ? form.invitedEmail : undefined);
</script>

<svelte:head>
	<title>Équipe · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="users-three" title="Équipe" context="Les personnes qui gèrent l’espace de votre groupement." />

{#if invitedEmail}<Alert tone="success">L’invitation est partie à {invitedEmail}.</Alert>{/if}

<Card>
	<ul class="grid">
		{#each data.groupMembers as groupMember (groupMember.accountId)}
			<li class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0">
				<span class="flex min-w-0 items-center gap-3">
					<Avatar name={groupMember.name} />
					<span class="min-w-0">
						<span class="block body-strong">
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
			<li class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-3">
				<span class="min-w-0">
					<span class="block body-strong">{invitation.email} <Tag tone="warning">Invité</Tag></span>
					<span class="block text-small text-ink-muted">L’invitation expire {formatDaysUntil(invitation.expiresAt)}</span>
				</span>
				<form method="POST" action="?/revokeInvitation">
					<input type="hidden" name="invitationId" value={invitation.invitationId} />
					<Button type="submit" variant="ghost" icon="x">Annuler</Button>
				</form>
			</li>
		{/each}
	</ul>
</Card>

<Card>
	<form method="POST" action="?/inviteColleague" class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
		<Field label="Inviter un collègue" hint="Il pourra inviter des pharmacies et suivre votre contrat." errorMessage={invitationFailure?.failureMessage}>
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
</Card>
