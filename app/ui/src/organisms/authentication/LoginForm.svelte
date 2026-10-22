<script lang="ts">
	import Button from '../../atoms/Button.svelte';
	import Input from '../../atoms/Input.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import Field from '../../molecules/Field.svelte';
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
	<Field label="Email">
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} type="email" name="email" autocomplete="email" required bind:value={email} />
		{/snippet}
	</Field>
	<Field label="Mot de passe">
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				type="password"
				name="password"
				autocomplete="current-password"
				required
				bind:value={password}
			/>
		{/snippet}
	</Field>
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	<Button type="submit" isFullWidth disabled={isSubmitting}>
		{isSubmitting ? 'Connexion…' : 'Se connecter'}
	</Button>
</form>
