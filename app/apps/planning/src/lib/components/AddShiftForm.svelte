<script lang="ts">
	import { Button, DatePicker, Field, SelectMenu, TimePicker } from '@crystal-pharm/ui';
	import type { Employee } from '$lib/domain/planning';

	type AddShiftFormProps = {
		formAction: string;
		cancelHref: string;
		employees: Employee[];
		defaultDate: string;
		errorMessage?: string;
		submittedValues?: Record<string, string>;
	};

	let { formAction, cancelHref, employees, defaultDate, errorMessage, submittedValues }: AddShiftFormProps =
		$props();

	const employeeOptions = $derived(
		employees.map((employee) => ({ value: employee.id, label: employee.fullName }))
	);
</script>

<form method="POST" action={formAction} class="grid gap-3.5">
	<Field label="Employé">
		{#snippet control({ id })}
			<SelectMenu
				{id}
				name="employeeId"
				options={employeeOptions}
				placeholder="Choisir un employé"
				value={submittedValues?.employeeId ?? ''}
			/>
		{/snippet}
	</Field>
	<Field label="Jour">
		{#snippet control({ id })}
			<DatePicker {id} name="date" value={submittedValues?.date ?? defaultDate} />
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
		<Button href={cancelHref} variant="ghost">Annuler</Button>
	</div>
</form>
