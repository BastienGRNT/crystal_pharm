<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, type ButtonSize, type ButtonVariant } from '@crystal-pharm/ui';
	import type { PrescriptionStep } from '../../pages/receivedPrescriptionsPageData';

	type PrescriptionStepFormProps = {
		submissionId: string;
		step: PrescriptionStep;
		isFullWidth?: boolean;
		variant?: ButtonVariant;
		size?: ButtonSize;
	};

	let { submissionId, step, isFullWidth = false, variant = 'primary', size = 'regular' }: PrescriptionStepFormProps = $props();

	let isSending = $state(false);
</script>

<form
	method="POST"
	action="?/changeStatus"
	use:enhance={() => {
		isSending = true;
		return async ({ update }) => {
			await update();
			isSending = false;
		};
	}}
>
	<input type="hidden" name="submissionId" value={submissionId} />
	<input type="hidden" name="status" value={step.status} />
	{#if step.notifiesByEmail}
		<input type="hidden" name="notifyByEmail" value="on" />
	{/if}
	<Button
		type="submit"
		icon={step.notifiesByEmail ? 'envelope-simple' : step.status === 'collected' ? 'check-circle' : 'check'}
		disabled={isSending}
		{variant}
		{size}
		{isFullWidth}
	>
		{step.label}
	</Button>
</form>
