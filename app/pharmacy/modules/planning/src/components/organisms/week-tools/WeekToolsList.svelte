<script lang="ts">
	import { Button } from '@crystal-pharm/ui';

	type WeekToolsListProps = {
		generateWeekFormAction: string;
		addShiftHref: string;
		activitiesHref: string;
		applyTemplateHref: string;
		saveTemplateHref: string;
	};

	let { generateWeekFormAction, addShiftHref, activitiesHref, applyTemplateHref, saveTemplateHref }: WeekToolsListProps = $props();
</script>

<div class="flex flex-col gap-4">
	<form method="POST" action={generateWeekFormAction} class="flex flex-col gap-2">
		<Button type="submit" icon="sparkle" isFullWidth>Proposer la semaine</Button>
		<p class="text-small text-ink-muted">Complète ce qui manque autour de ce qui est déjà posé, sans rien déplacer.</p>
	</form>

	<div class="flex flex-col gap-2">
		<Button href={addShiftHref} variant="secondary" icon="plus" isFullWidth>Ajouter un créneau</Button>
		<Button href={activitiesHref} variant="secondary" icon="calendar-check" isFullWidth>Formation ou astreinte</Button>
	</div>

	<div class="flex flex-col gap-2">
		<Button href={applyTemplateHref} variant="secondary" icon="calendar-dots" isFullWidth>Appliquer une semaine type</Button>
		<Button href={saveTemplateHref} variant="ghost" icon="check" isFullWidth>Enregistrer comme semaine type</Button>
	</div>
</div>
