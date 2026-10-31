<script lang="ts">
	import { Button, ChoiceGroup, DatePicker, Field, Input } from '@crystal-pharm/ui';
	import type { RequestableLeaveKind } from '../../../domain/leave/leaveRequests';

	type LeaveRequestFormProps = {
		formAction: string;
		leaveKinds: RequestableLeaveKind[];
		defaultDate: string;
		errorMessage?: string;
		submittedValues?: Record<string, string>;
	};

	let { formAction, leaveKinds, defaultDate, errorMessage, submittedValues }: LeaveRequestFormProps = $props();

	const kindOptions = $derived(leaveKinds.map((kind) => ({ value: kind, label: kind })));
</script>

<form method="POST" action={formAction} class="grid gap-3.5">
	<ChoiceGroup name="kind" legend="Type" options={kindOptions} value={submittedValues?.kind ?? leaveKinds[0] ?? ''} layout="segmented" />

	<div class="grid grid-cols-2 gap-3.5">
		<Field label="Premier jour">
			{#snippet control({ id })}
				<DatePicker {id} name="firstDate" value={submittedValues?.firstDate ?? defaultDate} />
			{/snippet}
		</Field>
		<Field label="Dernier jour">
			{#snippet control({ id })}
				<DatePicker {id} name="lastDate" value={submittedValues?.lastDate ?? defaultDate} />
			{/snippet}
		</Field>
	</div>

	<Field label="Note (facultatif)">
		{#snippet control({ id })}
			<Input {id} name="note" value={submittedValues?.note ?? ''} />
		{/snippet}
	</Field>

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}

	<div>
		<Button type="submit" icon="paper-plane-tilt">Demander</Button>
	</div>
</form>
