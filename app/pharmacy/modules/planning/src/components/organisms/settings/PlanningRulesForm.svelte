<script lang="ts">
	import { Button, Field, NumberStepper, UnitInput } from '@crystal-pharm/ui';
	import type { PlanningRulesFormValues } from '../../../pages/planningSettingsPageData';

	type PlanningRulesFormProps = {
		formAction: string;
		values: PlanningRulesFormValues;
		errorMessage?: string;
		isSaved: boolean;
	};

	let { formAction, values, errorMessage, isSaved }: PlanningRulesFormProps = $props();
</script>

<form method="POST" action={formAction} class="grid gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field label="Pharmaciens présents en permanence" hint="Au moins un est la règle courante ; montez ce nombre si votre officine l’exige.">
			{#snippet control(attributes)}
				<NumberStepper {...attributes} name="minimumPharmacistsPresent" min={0} max={10} unitLabel="pharmacien" value={values.minimumPharmacistsPresent} />
			{/snippet}
		</Field>
		<Field label="Personnes présentes en permanence" hint="Pharmaciens compris. Les heures d’affluence relèvent ce nombre.">
			{#snippet control(attributes)}
				<NumberStepper {...attributes} name="minimumPeoplePresent" min={0} max={30} unitLabel="personne" value={values.minimumPeoplePresent} />
			{/snippet}
		</Field>
		<Field label="Durée minimale d’une plage" hint="On ne fait pas venir quelqu’un pour une heure.">
			{#snippet control(attributes)}
				<UnitInput {...attributes} class="max-w-40" name="minimumShiftHours" unit="h" inputmode="decimal" value={values.minimumShiftHours} />
			{/snippet}
		</Field>
		<Field label="Créneaux par jour et par personne" hint="2 : matin et après-midi, avec la pause de midi.">
			{#snippet control(attributes)}
				<NumberStepper {...attributes} name="maximumShiftsPerDay" min={1} max={4} unitLabel="créneau" value={values.maximumShiftsPerDay} />
			{/snippet}
		</Field>
		<Field label="Repos entre deux journées" hint="Le planning proposé le respecte.">
			{#snippet control(attributes)}
				<UnitInput {...attributes} class="max-w-40" name="minimumRestHours" unit="h" inputmode="decimal" value={values.minimumRestHours} />
			{/snippet}
		</Field>
	</div>

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{:else if isSaved}
		<p role="status" class="text-[13px] leading-[18px] font-medium text-success">Règles enregistrées.</p>
	{/if}

	<div><Button type="submit" icon="check">Enregistrer les règles</Button></div>
</form>
