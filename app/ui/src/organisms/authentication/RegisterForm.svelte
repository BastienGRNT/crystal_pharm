<script lang="ts">
	import Button from '../../atoms/Button.svelte';
	import Input from '../../atoms/Input.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import Field from '../../molecules/Field.svelte';
	import type { AuthenticationSubmission, RegistrationDetails } from './authenticationForms';

	type RegisterFormProps = {
		onSubmit: AuthenticationSubmission<RegistrationDetails>;
	};

	let { onSubmit }: RegisterFormProps = $props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let password = $state('');
	let failureMessage = $state<string | undefined>();
	let isSubmitting = $state(false);

	async function submitRegistration(submitEvent: SubmitEvent) {
		submitEvent.preventDefault();
		isSubmitting = true;
		failureMessage = await onSubmit({ firstName, lastName, email, password });
		isSubmitting = failureMessage === undefined;
	}
</script>

<form class="grid gap-3" onsubmit={submitRegistration}>
	<div class="grid grid-cols-2 gap-3">
		<Field label="Prénom">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} name="firstName" autocomplete="given-name" required bind:value={firstName} />
			{/snippet}
		</Field>
		<Field label="Nom">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} name="lastName" autocomplete="family-name" required bind:value={lastName} />
			{/snippet}
		</Field>
	</div>
	<Field label="Email">
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} type="email" name="email" autocomplete="email" required bind:value={email} />
		{/snippet}
	</Field>
	<Field label="Mot de passe" hint="8 caractères minimum.">
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				type="password"
				name="password"
				autocomplete="new-password"
				required
				minlength={8}
				bind:value={password}
			/>
		{/snippet}
	</Field>
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	<Button type="submit" isFullWidth disabled={isSubmitting}>
		{isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
	</Button>
</form>
