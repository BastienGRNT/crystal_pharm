<script lang="ts">
	import { Button, Checkbox, Field, SelectMenu, UnitInput } from '@crystal-pharm/ui';
	import type { EmployeeTermsFormRow } from '../../../pages/planningSettingsPageData';

	type EmployeeTermsListProps = {
		formAction: string;
		employees: EmployeeTermsFormRow[];
		/** L'employé dont la dernière sauvegarde a abouti ou échoué, avec son message. */
		feedback?: { employeeId: string | undefined; message: string | undefined };
	};

	let { formAction, employees, feedback }: EmployeeTermsListProps = $props();

	const validationOptions = [
		{ value: 'manual', label: 'Je valide chaque demande' },
		{ value: 'automatic', label: 'Validation automatique' }
	];
</script>

<ul class="grid gap-3">
	{#each employees as employee (employee.employeeId)}
		<li class="rounded-md border border-line bg-surface p-4 shadow-card">
			<form method="POST" action={formAction} class="grid gap-3">
				<input type="hidden" name="employeeId" value={employee.employeeId} />
				<div class="flex flex-wrap items-baseline gap-x-3">
					<strong class="text-body font-semibold text-ink">{employee.fullName}</strong>
					<span class="text-small text-ink-subtle">{employee.jobTitle}</span>
				</div>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<Field label="Heures au contrat">
						{#snippet control(attributes)}
							<UnitInput {...attributes} name="weeklyContractHours" unit="h / sem." inputmode="decimal" value={employee.weeklyContractHours} placeholder="—" />
						{/snippet}
					</Field>
					<Field label="Taux horaire brut">
						{#snippet control(attributes)}
							<UnitInput {...attributes} name="hourlyRateEuros" unit="€ / h" inputmode="decimal" value={employee.hourlyRateEuros} placeholder="—" />
						{/snippet}
					</Field>
					<Field label="Ses disponibilités">
						{#snippet control(attributes)}
							<SelectMenu id={attributes.id} name="availabilityValidation" options={validationOptions} placeholder="Choisir" value={employee.availabilityValidation} />
						{/snippet}
					</Field>
					<div class="flex items-end pb-1.5">
						<Checkbox name="isStudent" checked={employee.isStudent}>Étudiant (placé en priorité sur les pics)</Checkbox>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<Button type="submit" variant="secondary" icon="check">Enregistrer</Button>
					{#if feedback?.employeeId === employee.employeeId && feedback.message}
						<p role="status" class="text-small font-medium {feedback.message.startsWith('Enregistré') ? 'text-success' : 'text-danger'}">{feedback.message}</p>
					{/if}
				</div>
			</form>
		</li>
	{/each}
</ul>
