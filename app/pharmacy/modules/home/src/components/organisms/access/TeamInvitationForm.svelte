<script lang="ts">
	import { Alert, Button, Field, Input, Select } from '@crystal-pharm/ui';
	import type { AccessFailure, AccessSection } from '../../../pages/pharmacy/pharmacyPageData';
	import ResponsibilityChoices from '../../molecules/ResponsibilityChoices.svelte';

	type TeamInvitationFormProps = {
		formAction: string;
		invitableEmployees: AccessSection['invitableEmployees'];
		failure: AccessFailure | undefined;
		cancelHref: string;
		/** Ajouter d'abord la personne à l'équipe, si elle n'y est pas. */
		teamHref: string;
	};

	let { formAction, invitableEmployees, failure, cancelHref, teamHref }: TeamInvitationFormProps = $props();
</script>

{#if invitableEmployees.length === 0}
	<div class="grid gap-3">
		<p class="text-body text-ink-muted">
			Chaque membre de l’équipe a déjà un compte ou une invitation. Pour inviter quelqu’un d’autre, ajoutez-le d’abord à l’équipe.
		</p>
		<Button href={teamHref} variant="secondary" icon="users-three">Voir l’équipe</Button>
	</div>
{:else}
	<form method="POST" action={formAction} class="grid gap-4">
		<p class="text-body text-ink-muted">
			La personne reçoit un email pour créer son compte. Elle aura accès à ce que vous cochez, et à son propre planning.
		</p>
		<Field label="Membre de l’équipe" errorMessage={failure?.failedFieldName === 'employeeId' ? failure.failureMessage : undefined}>
			{#snippet control(controlAttributes)}
				<Select {...controlAttributes} name="employeeId" required>
					{#each invitableEmployees as employee (employee.employeeId)}
						<option value={employee.employeeId}>{employee.fullName}</option>
					{/each}
				</Select>
			{/snippet}
		</Field>
		<Field label="Son email" errorMessage={failure?.failedFieldName === 'email' ? failure.failureMessage : undefined}>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="email" name="email" autocomplete="off" required />
			{/snippet}
		</Field>
		<ResponsibilityChoices selectedResponsibilityKeys={[]} />
		{#if failure && failure.failedFieldName === undefined}
			<Alert tone="danger">{failure.failureMessage}</Alert>
		{/if}
		<div class="flex flex-wrap gap-2">
			<Button type="submit" icon="paper-plane-tilt">Envoyer l’invitation</Button>
			<Button href={cancelHref} variant="ghost">Annuler</Button>
		</div>
	</form>
{/if}
