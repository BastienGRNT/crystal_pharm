<script lang="ts">
	import { Button, Checkbox, SelectMenu, UnitInput } from '@crystal-pharm/ui';
	import type { EmployeeTermsFormRow } from '../../../pages/planningSettingsPageData';

	type EmployeeTermsListProps = {
		formAction: string;
		employees: EmployeeTermsFormRow[];
		/** Le résultat du dernier enregistrement, et l'employé dont la ligne l'a fait échouer. */
		feedback?: { failedEmployeeId: string | undefined; message: string; isFailure: boolean };
	};

	let { formAction, employees, feedback }: EmployeeTermsListProps = $props();

	const validationOptions = [
		{ value: 'manual', label: 'Je valide chaque demande' },
		{ value: 'automatic', label: 'Acceptées d’office' }
	];

	const failedEmployeeName = $derived(employees.find((employee) => employee.employeeId === feedback?.failedEmployeeId)?.fullName);

	const columnsClasses = 'lg:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_13rem_6.5rem_7.5rem]';
	const fieldLabelClasses = 'text-label text-ink-muted lg:sr-only';
</script>

<form method="POST" action={formAction} class="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
	<div class="hidden gap-3 border-b border-line bg-surface-subtle px-4 py-2 text-label text-ink-muted lg:grid {columnsClasses}">
		<span>Employé</span>
		<span>Heures au contrat</span>
		<span>Taux horaire brut</span>
		<span>Ses disponibilités</span>
		<span>Étudiant</span>
		<span>Horaires posés à la main</span>
	</div>
	<ul>
		{#each employees as employee (employee.employeeId)}
			{@const fieldId = (fieldName: string) => `${fieldName}-${employee.employeeId}`}
			<li
				class="grid items-center gap-3 border-line-soft px-4 py-3 not-last:border-b sm:grid-cols-2 {columnsClasses} {feedback?.failedEmployeeId === employee.employeeId
					? 'bg-danger-soft'
					: ''}"
			>
				<input type="hidden" name="employeeId" value={employee.employeeId} />
				<p class="grid min-w-0 sm:col-span-2 lg:col-span-1">
					<strong class="truncate text-body font-semibold text-ink">{employee.fullName}</strong>
					<span class="truncate text-small text-ink-subtle">{employee.jobTitle}</span>
				</p>
				<div class="grid gap-1">
					<label for={fieldId('contract')} class={fieldLabelClasses}>Heures au contrat</label>
					<UnitInput id={fieldId('contract')} name="weeklyContractHours.{employee.employeeId}" unit="h / sem." inputmode="decimal" value={employee.weeklyContractHours} placeholder="—" />
				</div>
				<div class="grid gap-1">
					<label for={fieldId('rate')} class={fieldLabelClasses}>Taux horaire brut</label>
					<UnitInput id={fieldId('rate')} name="hourlyRateEuros.{employee.employeeId}" unit="€ / h" inputmode="decimal" value={employee.hourlyRateEuros} placeholder="—" />
				</div>
				<div class="grid gap-1">
					<label for={fieldId('validation')} class={fieldLabelClasses}>Ses disponibilités</label>
					<SelectMenu id={fieldId('validation')} name="availabilityValidation.{employee.employeeId}" options={validationOptions} placeholder="Choisir" value={employee.availabilityValidation} />
				</div>
				<Checkbox name="isStudent.{employee.employeeId}" checked={employee.isStudent}>
					<span class="lg:sr-only">Étudiant, placé en priorité aux heures d’affluence</span><span class="max-lg:hidden">Oui</span>
				</Checkbox>
				<Checkbox name="isPlannedManually.{employee.employeeId}" checked={employee.isPlannedManually}>
					<span class="lg:sr-only">Horaires posés à la main, jamais proposés par le planning</span><span class="max-lg:hidden">Oui</span>
				</Checkbox>
			</li>
		{/each}
	</ul>
	<div class="flex flex-wrap items-center gap-3 border-t border-line bg-surface-subtle px-4 py-3">
		<Button type="submit" icon="check">Enregistrer les contrats</Button>
		{#if feedback}
			<p role={feedback.isFailure ? 'alert' : 'status'} class="text-small font-medium {feedback.isFailure ? 'text-danger' : 'text-success'}">
				{failedEmployeeName ? `${failedEmployeeName}\u00a0: ${feedback.message}` : feedback.message}
			</p>
		{/if}
	</div>
</form>
