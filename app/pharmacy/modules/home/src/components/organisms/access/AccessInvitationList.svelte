<script lang="ts">
	import { ConfirmButton } from '@crystal-pharm/ui';
	import { formatDay } from '../../../dateFormats';
	import type { AccessInvitation } from '../../../pages/pharmacy/pharmacyPageData';

	type AccessInvitationListProps = {
		invitations: AccessInvitation[];
		/** L'action SvelteKit qui annule une invitation, avec son `invitationId`. */
		revokeAction: string;
	};

	let { invitations, revokeAction }: AccessInvitationListProps = $props();
</script>

<ul class="grid divide-y divide-line-soft">
	{#each invitations as invitation (invitation.invitationId)}
		<li class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
			<p class="text-body">
				<span class="body-strong">{invitation.employeeFullName}</span>
				<span class="text-ink-muted"> · {invitation.email} · valable jusqu’au {formatDay(invitation.expiresAt)}</span>
			</p>
			<form method="POST" action={revokeAction}>
				<ConfirmButton
					label="Annuler"
					icon="x"
					variant="ghost"
					title="Annuler l’invitation de {invitation.employeeFullName} ?"
					description="Le lien reçu par email ne fonctionnera plus. Vous pourrez l’inviter à nouveau."
					confirmLabel="Annuler l’invitation"
					isDestructive
					name="invitationId"
					value={invitation.invitationId}
				/>
			</form>
		</li>
	{/each}
</ul>
