<script lang="ts">
	import { Button, ChoiceGroup, Field, Input } from '@crystal-pharm/ui';
	import { rotationLabels } from '../../../domain/templates/weekTemplates';

	type SaveWeekTemplateFormProps = { formAction: string; cancelHref: string; errorMessage?: string };

	let { formAction, cancelHref, errorMessage }: SaveWeekTemplateFormProps = $props();

	const rotationOptions = [
		{ value: 'none', label: rotationLabels.none },
		{ value: 'A', label: rotationLabels.A },
		{ value: 'B', label: rotationLabels.B }
	];
</script>

<form method="POST" action={formAction} class="grid gap-3.5">
	<p class="text-small text-ink-muted">Garde les créneaux de la semaine affichée pour les rejouer sur n’importe quelle autre semaine.</p>
	<Field label="Nom de la semaine type">
		{#snippet control(attributes)}
			<Input {...attributes} name="name" placeholder="Semaine normale" maxlength={60} />
		{/snippet}
	</Field>
	<ChoiceGroup name="rotation" legend="Quand l’utiliser" options={rotationOptions} value="none" layout="cards" />
	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}
	<div class="mt-1 flex gap-2">
		<Button type="submit" icon="check">Enregistrer</Button>
		<Button href={cancelHref} variant="ghost">Annuler</Button>
	</div>
</form>
