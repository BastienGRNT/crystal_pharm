<script lang="ts">
	import { Button, Field, UnitInput } from '@crystal-pharm/ui';
	import type { OvertimeRulesFormValues } from '../../../pages/planningSettingsPageData';

	type OvertimeRulesFormProps = {
		formAction: string;
		values: OvertimeRulesFormValues;
		errorMessage?: string;
		isSaved: boolean;
	};

	let { formAction, values, errorMessage, isSaved }: OvertimeRulesFormProps = $props();
</script>

<form method="POST" action={formAction} class="grid gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field label="Heures supplémentaires au-delà de" hint="La durée légale : 35 h par semaine.">
			{#snippet control(attributes)}
				<UnitInput {...attributes} name="weeklyThresholdHours" unit="h / sem." inputmode="decimal" value={values.weeklyThresholdHours} />
			{/snippet}
		</Field>
		<Field label="Première tranche" hint="8 h : de la 36e à la 43e heure.">
			{#snippet control(attributes)}
				<UnitInput {...attributes} name="firstBandHours" unit="h" inputmode="decimal" value={values.firstBandHours} />
			{/snippet}
		</Field>
		<Field label="Majoration de la première tranche">
			{#snippet control(attributes)}
				<UnitInput {...attributes} name="firstBandRatePercent" unit="%" inputmode="numeric" value={values.firstBandRatePercent} />
			{/snippet}
		</Field>
		<Field label="Majoration au-delà">
			{#snippet control(attributes)}
				<UnitInput {...attributes} name="beyondRatePercent" unit="%" inputmode="numeric" value={values.beyondRatePercent} />
			{/snippet}
		</Field>
	</div>

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{:else if isSaved}
		<p role="status" class="text-[13px] leading-[18px] font-medium text-success">Majorations enregistrées.</p>
	{/if}

	<div><Button type="submit" icon="check">Enregistrer les majorations</Button></div>
</form>
