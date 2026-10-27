<script lang="ts">
	import { Alert, Button, Field, Input } from '@crystal-pharm/ui';
	import type { AccessFailure } from '../../../pages/pharmacy/pharmacyPageData';
	import ResponsibilityChoices from '../../molecules/ResponsibilityChoices.svelte';

	type CounterAccountFormProps = {
		formAction: string;
		failure: AccessFailure | undefined;
		cancelHref: string;
	};

	let { formAction, failure, cancelHref }: CounterAccountFormProps = $props();
</script>

<form method="POST" action={formAction} class="grid gap-4">
	<p class="text-body text-ink-muted">
		Un seul compte, partagé par l’équipe au comptoir. Il se connecte avec un identifiant, sans email, et n’a pas de planning à lui.
	</p>
	<Field
		label="Identifiant"
		hint="Lettres sans accent, chiffres, points et tirets bas. Par exemple : comptoir.saintlouis"
		errorMessage={failure?.failedFieldName === 'username' ? failure.failureMessage : undefined}
	>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} name="username" autocomplete="off" required />
		{/snippet}
	</Field>
	<Field
		label="Mot de passe"
		hint="Au moins 8 caractères."
		errorMessage={failure?.failedFieldName === 'password' ? failure.failureMessage : undefined}
	>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} type="password" name="password" autocomplete="new-password" required />
		{/snippet}
	</Field>
	<ResponsibilityChoices selectedResponsibilityKeys={['handle-appointments', 'handle-prescriptions']} />
	{#if failure && failure.failedFieldName === undefined}
		<Alert tone="danger">{failure.failureMessage}</Alert>
	{/if}
	<div class="flex flex-wrap gap-2">
		<Button type="submit" icon="user-plus">Créer le compte comptoir</Button>
		<Button href={cancelHref} variant="ghost">Annuler</Button>
	</div>
</form>
