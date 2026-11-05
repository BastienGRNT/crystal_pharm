<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '../../atoms/actions/Button.svelte';
	import Input from '../../atoms/fields/Input.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import CheckList from '../../molecules/CheckList.svelte';
	import Field from '../../molecules/fields/Field.svelte';
	import type { AuthenticationSubmission, PasswordRequirement, RegistrationDetails } from './authenticationForms';

	type RegisterFormProps = {
		onSubmit: AuthenticationSubmission<RegistrationDetails>;
		/** L'email déjà connu (une invitation) ; verrouillé, il ne peut plus être changé. */
		initialEmail?: string;
		isEmailLocked?: boolean;
		/** Les conditions du mot de passe, cochées pendant la saisie. Sans elles : 8 caractères minimum. */
		passwordRequirements?: readonly PasswordRequirement[];
	};

	let { onSubmit, initialEmail = '', isEmailLocked = false, passwordRequirements }: RegisterFormProps = $props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state(untrack(() => initialEmail));
	let password = $state('');
	let failureMessage = $state<string | undefined>();
	let isSubmitting = $state(false);

	const passwordChecklist = $derived(
		passwordRequirements?.map((requirement) => ({ title: requirement.label, isChecked: requirement.isMetBy(password) }))
	);
	const isPasswordAccepted = $derived(passwordChecklist?.every((item) => item.isChecked) ?? true);

	async function submitRegistration(submitEvent: SubmitEvent) {
		submitEvent.preventDefault();
		if (!isPasswordAccepted) {
			failureMessage = 'Le mot de passe ne remplit pas encore toutes les conditions.';
			return;
		}
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
			<Input {...controlAttributes} type="email" name="email" autocomplete="email" required readonly={isEmailLocked} bind:value={email} />
		{/snippet}
	</Field>
	<Field label="Mot de passe" hint={passwordChecklist ? undefined : '8 caractères minimum.'}>
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				type="password"
				name="password"
				autocomplete="new-password"
				required
				minlength={passwordChecklist ? undefined : 8}
				bind:value={password}
			/>
		{/snippet}
	</Field>
	{#if passwordChecklist}
		<CheckList items={passwordChecklist} />
	{/if}
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	<Button type="submit" isFullWidth disabled={isSubmitting}>
		{isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
	</Button>
</form>
