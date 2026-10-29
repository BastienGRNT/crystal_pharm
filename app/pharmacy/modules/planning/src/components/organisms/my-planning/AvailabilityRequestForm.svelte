<script lang="ts">
	import { Button, ChoiceGroup, DatePicker, Field, Input, SelectMenu, TimePicker } from '@crystal-pharm/ui';

	type AvailabilityRequestFormProps = {
		formAction: string;
		errorMessage?: string;
		submittedValues?: Record<string, string>;
	};

	let { formAction, errorMessage, submittedValues }: AvailabilityRequestFormProps = $props();

	const kindOptions = [
		{ value: 'unavailable', label: 'Indisponible', description: 'Je ne peux pas travailler' },
		{ value: 'course', label: 'Cours', description: 'Je suis en cours' },
		{ value: 'available', label: 'Disponible', description: 'Je peux travailler en plus' }
	];
	const recurrenceOptions = [
		{ value: 'weekly', label: 'Chaque semaine' },
		{ value: 'once', label: 'Un jour précis' }
	];
	const weekdayOptions = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((label, index) => ({
		value: String(index),
		label
	}));

	let recurrence = $state('weekly');
</script>

<form method="POST" action={formAction} class="grid gap-3.5">
	<ChoiceGroup name="kind" legend="Type" options={kindOptions} value={submittedValues?.kind ?? 'unavailable'} layout="segmented" />
	<ChoiceGroup name="recurrence" legend="Quand" options={recurrenceOptions} bind:value={recurrence} layout="segmented" />

	{#if recurrence === 'weekly'}
		<Field label="Jour de la semaine">
			{#snippet control({ id })}
				<SelectMenu {id} name="weekday" options={weekdayOptions} placeholder="Choisir un jour" value={submittedValues?.weekday ?? ''} />
			{/snippet}
		</Field>
	{:else}
		<Field label="Jour">
			{#snippet control({ id })}
				<DatePicker {id} name="date" value={submittedValues?.date ?? ''} />
			{/snippet}
		</Field>
	{/if}

	<div class="grid grid-cols-2 gap-3.5">
		<Field label="De">
			{#snippet control({ id })}
				<TimePicker {id} name="startTime" value={submittedValues?.startTime ?? '08:00'} />
			{/snippet}
		</Field>
		<Field label="À">
			{#snippet control({ id })}
				<TimePicker {id} name="endTime" value={submittedValues?.endTime ?? '19:00'} />
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
		<Button type="submit" icon="plus">Envoyer</Button>
	</div>
</form>
