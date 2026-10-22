<script lang="ts">
	import { Button, Field, Input, Select } from '@crystal-pharm/ui';
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
</script>

<form method="POST" action={formAction} class="grid gap-3.5">
	<Field label="Employé">
		{#snippet control(controlAttributes)}
			<Select {...controlAttributes} name="employeeId" value={submittedValues?.employeeId ?? ''}>
				<option value="" disabled>Choisir un employé</option>
				{#each employees as employee (employee.id)}
					<option value={employee.id}>{employee.fullName}</option>
				{/each}
			</Select>
		{/snippet}
	</Field>
	<Field label="Jour">
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} type="date" name="date" value={submittedValues?.date ?? defaultDate} />
		{/snippet}
	</Field>
	<div class="grid grid-cols-2 gap-3.5">
		<Field label="Début">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="time" name="startTime" value={submittedValues?.startTime ?? ''} />
			{/snippet}
		</Field>
		<Field label="Fin">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="time" name="endTime" value={submittedValues?.endTime ?? ''} />
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
