<script lang="ts">
	import { Button, DatePicker, Field, FormSection, Input, SelectMenu, TimePicker } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { addMinutesToTime } from '../../domain/agenda';
	import type { AddAppointmentPanel, AppointmentFormValues, AppointmentsActionFailure } from '../../pages/appointmentsPageData';

	type AddAppointmentFormProps = {
		panel: AddAppointmentPanel;
		errorMessage?: string;
		failedFieldName?: AppointmentsActionFailure['failedFieldName'];
		submittedValues?: AppointmentFormValues;
	};

	let { panel, errorMessage, failedFieldName, submittedValues }: AddAppointmentFormProps = $props();

	let reason = $state(untrack(() => submittedValues?.reason ?? ''));
	let startTime = $state(untrack(() => submittedValues?.startTime ?? ''));
	let endTime = $state(untrack(() => submittedValues?.endTime ?? ''));
	let proposedEndTime = $state('');

	const reasonDurationInMinutes = $derived(panel.reasonDurationsInMinutes[reason]);
	const isEndTimeChosenByHand = $derived(endTime !== '' && endTime !== proposedEndTime);

	// Le motif dit combien dure le rendez-vous : la fin se propose seule, sans jamais réécrire celle qu'on a choisie soi-même.
	$effect(() => {
		if (!startTime || !reasonDurationInMinutes || untrack(() => isEndTimeChosenByHand)) return;
		proposedEndTime = addMinutesToTime(startTime, reasonDurationInMinutes) ?? '';
		endTime = proposedEndTime;
	});

	const errorOf = (fieldName: NonNullable<AddAppointmentFormProps['failedFieldName']>): string | undefined =>
		failedFieldName === fieldName ? errorMessage : undefined;
</script>

<!-- Dans l'ordre d'un appel au comptoir : pour quoi, quand, puis qui. -->
<form method="POST" action={panel.formAction} class="grid gap-7">
	<FormSection layout="stacked" stepNumber={1} title="Le rendez-vous">
		<Field label="Motif" errorMessage={errorOf('reason')}>
			{#snippet control({ id })}
				<SelectMenu {id} name="reason" options={panel.reasonOptions} placeholder="Choisir un motif" bind:value={reason} />
			{/snippet}
		</Field>
		<Field label="Avec" errorMessage={errorOf('employeeId')}>
			{#snippet control({ id })}
				<SelectMenu
					{id}
					name="employeeId"
					options={panel.employeeOptions}
					placeholder="Choisir une personne"
					value={submittedValues?.employeeId ?? ''}
				/>
			{/snippet}
		</Field>
	</FormSection>

	<FormSection layout="stacked" stepNumber={2} title="Quand">
		<Field label="Jour" errorMessage={errorOf('date')}>
			{#snippet control({ id })}
				<DatePicker {id} name="date" value={submittedValues?.date ?? panel.defaultDate} />
			{/snippet}
		</Field>
		<div class="grid grid-cols-2 gap-3.5">
			<Field label="Début" errorMessage={errorOf('startTime')}>
				{#snippet control({ id })}
					<TimePicker {id} name="startTime" bind:value={startTime} />
				{/snippet}
			</Field>
			<Field
				label="Fin"
				hint={reasonDurationInMinutes && !isEndTimeChosenByHand ? `Durée du motif : ${reasonDurationInMinutes} min` : undefined}
				errorMessage={errorOf('endTime')}
			>
				{#snippet control({ id })}
					<TimePicker {id} name="endTime" bind:value={endTime} />
				{/snippet}
			</Field>
		</div>
	</FormSection>

	<FormSection layout="stacked" stepNumber={3} title="Le patient">
		<Field label="Nom" errorMessage={errorOf('patientName')}>
			{#snippet control(attributes)}
				<Input {...attributes} name="patientName" autocomplete="off" value={submittedValues?.patientName ?? ''} />
			{/snippet}
		</Field>
		<Field label="Téléphone" errorMessage={errorOf('patientPhone')}>
			{#snippet control(attributes)}
				<Input {...attributes} name="patientPhone" type="tel" autocomplete="off" value={submittedValues?.patientPhone ?? ''} />
			{/snippet}
		</Field>
		<Field label="Email (facultatif)" hint="Il reçoit la confirmation, sans le motif." errorMessage={errorOf('patientEmail')}>
			{#snippet control(attributes)}
				<Input {...attributes} name="patientEmail" type="email" autocomplete="off" value={submittedValues?.patientEmail ?? ''} />
			{/snippet}
		</Field>
	</FormSection>

	{#if errorMessage && !failedFieldName}
		<p role="alert" class="text-small font-bold text-danger">{errorMessage}</p>
	{/if}

	<!-- Le bouton reste visible quelle que soit la hauteur de l'écran : on n'a pas à le chercher en bas. -->
	<div class="sticky -bottom-5 -mx-6 -mb-5 flex gap-2 border-t border-line bg-app px-6 py-4 max-sm:-mx-4 max-sm:px-4">
		<Button type="submit" icon="plus">Ajouter le rendez-vous</Button>
		<Button href={panel.closeHref} variant="ghost">Annuler</Button>
	</div>
</form>
