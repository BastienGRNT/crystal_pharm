<script lang="ts">
	import { Button, DatePicker, Field, Input, SelectMenu, TimePicker } from '@crystal-pharm/ui';
	import type { AddAppointmentPanel, AppointmentFormValues } from '../pages/appointmentsPageData';

	type AddAppointmentFormProps = {
		panel: AddAppointmentPanel;
		errorMessage?: string;
		submittedValues?: AppointmentFormValues;
	};

	let { panel, errorMessage, submittedValues }: AddAppointmentFormProps = $props();
</script>

<form method="POST" action={panel.formAction} class="grid gap-3.5">
	<Field label="Patient">
		{#snippet control({ id })}
			<Input {id} name="patientName" autocomplete="off" value={submittedValues?.patientName ?? ''} />
		{/snippet}
	</Field>
	<Field label="Téléphone">
		{#snippet control({ id })}
			<Input {id} name="patientPhone" type="tel" autocomplete="off" value={submittedValues?.patientPhone ?? ''} />
		{/snippet}
	</Field>
	<Field label="Motif">
		{#snippet control({ id })}
			<SelectMenu
				{id}
				name="reason"
				options={panel.reasonOptions}
				placeholder="Choisir un motif"
				value={submittedValues?.reason ?? ''}
			/>
		{/snippet}
	</Field>
	<Field label="Avec">
		{#snippet control({ id })}
			<SelectMenu
				{id}
				name="employeeId"
				options={panel.employeeOptions}
				placeholder="Choisir un employé"
				value={submittedValues?.employeeId ?? ''}
			/>
		{/snippet}
	</Field>
	<Field label="Jour">
		{#snippet control({ id })}
			<DatePicker {id} name="date" value={submittedValues?.date ?? panel.defaultDate} />
		{/snippet}
	</Field>
	<div class="grid grid-cols-2 gap-3.5">
		<Field label="Début">
			{#snippet control({ id })}
				<TimePicker {id} name="startTime" value={submittedValues?.startTime ?? ''} />
			{/snippet}
		</Field>
		<Field label="Fin">
			{#snippet control({ id })}
				<TimePicker {id} name="endTime" value={submittedValues?.endTime ?? ''} />
			{/snippet}
		</Field>
	</div>

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}

	<div class="mt-1 flex gap-2">
		<Button type="submit" icon="plus">Ajouter</Button>
		<Button href={panel.closeHref} variant="ghost">Annuler</Button>
	</div>
</form>
