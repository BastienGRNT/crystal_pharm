<script lang="ts">
	import Button from '../../atoms/Button.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import TextField from '../../molecules/TextField.svelte';
	import type { AuthenticationSubmission, LoginCredentials } from './authenticationForms';

	type LoginFormProps = {
		onSubmit: AuthenticationSubmission<LoginCredentials>;
	};

	let { onSubmit }: LoginFormProps = $props();

	let email = $state('');
	let password = $state('');
	let failureMessage = $state<string | undefined>();
	let isSubmitting = $state(false);

	async function submitCredentials(submitEvent: SubmitEvent) {
		submitEvent.preventDefault();
		isSubmitting = true;
		failureMessage = await onSubmit({ email, password });
		isSubmitting = failureMessage === undefined;
	}
</script>

<form class="grid gap-3" onsubmit={submitCredentials}>
	<TextField label="Email" type="email" name="email" autocomplete="email" required height="lg" bind:value={email} />
	<TextField
		label="Mot de passe"
		type="password"
		name="password"
		autocomplete="current-password"
		required
		height="lg"
		bind:value={password}
	/>
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	<Button type="submit" size="lg" isFullWidth disabled={isSubmitting}>
		{isSubmitting ? 'Connexion…' : 'Se connecter'}
	</Button>
</form>
