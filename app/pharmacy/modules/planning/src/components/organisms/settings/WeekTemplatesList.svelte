<script lang="ts">
	import { Button, StatusBadge } from '@crystal-pharm/ui';
	import type { WeekTemplateView } from '../../../pages/planningSettingsPageData';

	type WeekTemplatesListProps = { removeFormAction: string; templates: WeekTemplateView[] };

	let { removeFormAction, templates }: WeekTemplatesListProps = $props();
</script>

<ul class="grid gap-2">
	{#each templates as template (template.id)}
		<li class="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface px-4 py-2.5 shadow-card">
			<strong class="text-body font-semibold text-ink">{template.name}</strong>
			<StatusBadge tone="neutral">{template.rotationLabel}</StatusBadge>
			<span class="flex-1 text-small text-ink-muted">{template.shiftCount} créneaux</span>
			<form method="POST" action={removeFormAction}>
				<input type="hidden" name="templateId" value={template.id} />
				<Button type="submit" variant="ghost" icon="trash">Supprimer</Button>
			</form>
		</li>
	{/each}
</ul>
