<script lang="ts">
	import Button from '../../atoms/Button.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import TextField from '../../molecules/TextField.svelte';
	import type { AuthenticationSubmission, RegistrationDetails } from './authenticationForms';

	type RegisterFormProps = {
		onSubmit: AuthenticationSubmission<RegistrationDetails>;
	};

	let { onSubmit }: RegisterFormProps = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let failureMessage = $state<string | undefined>();
	let isSubmitting = $state(false);

	async function submitRegistration(submitEvent: SubmitEvent) {
		submitEvent.preventDefault();
		isSubmitting = true;
		failureMessage = await onSubmit({ name, email, password });
		isSubmitting = failureMessage === undefined;
	}
</script>

<form class="grid gap-3" onsubmit={submitRegistration}>
	<TextField label="Prénom et nom" name="name" autocomplete="name" required height="lg" bind:value={name} />
	<TextField label="Email" type="email" name="email" autocomplete="email" required height="lg" bind:value={email} />
	<TextField
		label="Mot de passe"
		type="password"
		name="password"
		autocomplete="new-password"
		required
		minlength={8}
		hint="8 caractères minimum."
		height="lg"
		bind:value={password}
	/>
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	<Button type="submit" size="lg" isFullWidth disabled={isSubmitting}>
		{isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
	</Button>
</form>
