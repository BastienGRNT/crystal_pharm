<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../../atoms/actions/Button.svelte';
	import Input from '../../atoms/fields/Input.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import Field from '../../molecules/fields/Field.svelte';
	import type { AuthenticationSubmission, LoginCredentials } from './authenticationForms';

	type LoginFormProps = {
		onSubmit: AuthenticationSubmission<LoginCredentials>;
		/** L'email déjà connu (une invitation) ; verrouillé, il ne peut plus être changé. */
		initialEmail?: string;
		isEmailLocked?: boolean;
	};

	let { onSubmit, initialEmail = '', isEmailLocked = false }: LoginFormProps = $props();

	let email = $state(untrack(() => initialEmail));
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
			<Input {...controlAttributes} type="email" name="email" autocomplete="email" required readonly={isEmailLocked} bind:value={email} />
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
