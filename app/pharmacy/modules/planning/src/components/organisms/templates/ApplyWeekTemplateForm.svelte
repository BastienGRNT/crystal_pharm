<script lang="ts">
	import { Button } from '@crystal-pharm/ui';
	import type { WeekTemplateView } from '../../../pages/planningSettingsPageData';

	type ApplyWeekTemplateFormProps = { formAction: string; cancelHref: string; templates: WeekTemplateView[]; errorMessage?: string };

	let { formAction, cancelHref, templates, errorMessage }: ApplyWeekTemplateFormProps = $props();
</script>

<form method="POST" action={formAction} class="grid gap-3">
	<p class="text-small text-ink-muted">
		Les créneaux déjà posés ne bougent pas : on saute ce qui les chevauche, une absence ou une indisponibilité.
	</p>
	{#if templates.length > 1}
		<Button type="submit" name="templateId" value="auto" icon="check">Choisir selon la rotation A/B</Button>
	{/if}
	<ul class="grid gap-2">
		{#each templates as template (template.id)}
			<li>
				<Button type="submit" name="templateId" value={template.id} variant="secondary">
					{template.name} · {template.rotationLabel}
				</Button>
			</li>
		{/each}
	</ul>
	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}
	<div><Button href={cancelHref} variant="ghost">Annuler</Button></div>
</form>
