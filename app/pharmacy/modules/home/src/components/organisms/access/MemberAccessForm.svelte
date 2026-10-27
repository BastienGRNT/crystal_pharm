<script lang="ts">
	import { Alert, Button, ConfirmButton, Field, Input } from '@crystal-pharm/ui';
	import type { AccessFailure, AccessMember } from '../../../pages/pharmacy/pharmacyPageData';
	import ResponsibilityChoices from '../../molecules/ResponsibilityChoices.svelte';

	type MemberAccessFormProps = {
		member: AccessMember;
		failure: AccessFailure | undefined;
		cancelHref: string;
	};

	let { member, failure, cancelHref }: MemberAccessFormProps = $props();
</script>

<div class="grid gap-5">
	{#if failure && failure.failedFieldName !== 'password'}
		<Alert tone="danger">{failure.failureMessage}</Alert>
	{/if}

	{#if member.isOwner}
		<p class="text-body text-ink-muted">
			Titulaire : tous les droits sur la pharmacie, son abonnement et ses accès compris.
		</p>
		<form method="POST" action="?/withdrawOwnership">
			<input type="hidden" name="accountId" value={member.accountId} />
			<ConfirmButton
				label="Retirer le titre de titulaire"
				icon="user-switch"
				title="Retirer le titre de titulaire à {member.name} ?"
				description="Ce compte n’aura plus accès à l’abonnement ni aux accès, ni à aucune responsabilité tant que vous ne lui en donnez pas."
				confirmLabel="Retirer le titre"
				isDestructive
			/>
		</form>
	{:else}
		<form method="POST" action="?/updateResponsibilities" class="grid gap-4">
			<input type="hidden" name="accountId" value={member.accountId} />
			<ResponsibilityChoices selectedResponsibilityKeys={member.responsibilityKeys} />
			<div class="flex flex-wrap gap-2">
				<Button type="submit">Enregistrer</Button>
				<Button href={cancelHref} variant="ghost">Annuler</Button>
			</div>
		</form>
		{#if !member.isCounterAccount}
			<form method="POST" action="?/appointOwner">
				<input type="hidden" name="accountId" value={member.accountId} />
				<ConfirmButton
					label="Nommer titulaire"
					icon="seal-check"
					title="Nommer {member.name} titulaire ?"
					description="Ce compte aura tous les droits, comme vous : l’abonnement, les accès de l’équipe, et le droit de vous retirer le titre."
					confirmLabel="Nommer titulaire"
				/>
			</form>
		{/if}
	{/if}

	{#if member.isCounterAccount}
		<form method="POST" action="?/changeCounterAccountPassword" class="grid gap-3">
			<input type="hidden" name="accountId" value={member.accountId} />
			<Field
				label="Nouveau mot de passe"
				hint="Au moins 8 caractères. Le comptoir devra se reconnecter."
				errorMessage={failure?.failedFieldName === 'password' ? failure.failureMessage : undefined}
			>
				{#snippet control(controlAttributes)}
					<Input {...controlAttributes} type="password" name="password" autocomplete="new-password" required />
				{/snippet}
			</Field>
			<div><Button type="submit" variant="secondary" icon="lock-simple">Changer le mot de passe</Button></div>
		</form>
	{/if}

	<form method="POST" action="?/removeMember" class="border-t border-line-soft pt-4">
		<input type="hidden" name="accountId" value={member.accountId} />
		<ConfirmButton
			label={member.isCounterAccount ? 'Supprimer le compte comptoir' : 'Retirer l’accès à la pharmacie'}
			icon="trash"
			variant="ghost"
			title={member.isCounterAccount ? 'Supprimer le compte comptoir ?' : `Retirer l’accès de ${member.name} ?`}
			description={member.isCounterAccount
				? 'Plus personne ne pourra s’y connecter. Vous pourrez en créer un autre.'
				: 'Ce compte ne pourra plus ouvrir la pharmacie. La personne reste dans l’équipe affichée sur le site.'}
			confirmLabel={member.isCounterAccount ? 'Supprimer' : 'Retirer l’accès'}
			isDestructive
		/>
	</form>
</div>
