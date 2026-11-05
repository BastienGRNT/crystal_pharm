<script lang="ts">
	import Button from '../../atoms/actions/Button.svelte';
	import Input from '../../atoms/fields/Input.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import Field from '../../molecules/fields/Field.svelte';
	import type { AuthenticationSubmission, EmailVerificationDetails } from './authenticationForms';

	type EmailVerificationFormProps = {
		codeLength: number;
		onSubmit: AuthenticationSubmission<EmailVerificationDetails>;
		/** Envoie un code neuf ; renvoie le message d'échec, s'il y en a un. */
		onResend: () => Promise<string | undefined>;
	};

	let { codeLength, onSubmit, onResend }: EmailVerificationFormProps = $props();

	let code = $state('');
	let failureMessage = $state<string | undefined>();
	let resendConfirmation = $state<string | undefined>();
	let isSubmitting = $state(false);

	async function submitCode(submitEvent: SubmitEvent) {
		submitEvent.preventDefault();
		resendConfirmation = undefined;
		isSubmitting = true;
		failureMessage = await onSubmit({ code: code.trim() });
		isSubmitting = failureMessage === undefined;
	}

	async function resendCode() {
		failureMessage = await onResend();
		resendConfirmation = failureMessage === undefined ? 'Un nouveau code vient de vous être envoyé.' : undefined;
		code = '';
	}
</script>

<form class="grid gap-3" onsubmit={submitCode}>
	<Field label="Code reçu par email">
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				name="code"
				inputmode="numeric"
				autocomplete="one-time-code"
				maxlength={codeLength}
				pattern={`[0-9]{${codeLength}}`}
				placeholder={'0'.repeat(codeLength)}
				required
				bind:value={code}
			/>
		{/snippet}
	</Field>
	{#if failureMessage}
		<Alert tone="danger">{failureMessage}</Alert>
	{/if}
	{#if resendConfirmation}
		<Alert tone="success">{resendConfirmation}</Alert>
	{/if}
	<Button type="submit" isFullWidth disabled={isSubmitting || code.trim().length !== codeLength}>
		{isSubmitting ? 'Vérification…' : 'Confirmer mon email'}
	</Button>
	<Button type="button" variant="ghost" isFullWidth disabled={isSubmitting} onclick={resendCode}>Renvoyer un code</Button>
</form>
