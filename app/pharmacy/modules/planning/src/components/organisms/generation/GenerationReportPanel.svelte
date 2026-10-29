<script lang="ts">
	import { Alert } from '@crystal-pharm/ui';
	import type { WeekGenerationReportView } from '../../../pages/teamPlanningPageData';

	type GenerationReportPanelProps = { report: WeekGenerationReportView; closeHref: string };

	let { report, closeHref }: GenerationReportPanelProps = $props();
</script>

<Alert tone={report.unfilledGaps.length > 0 ? 'warning' : 'success'} title="Semaine proposée">
	<p>
		{report.addedCount === 0 ? 'Rien à ajouter : les règles sont déjà respectées.' : `${report.addedCount} créneau${report.addedCount > 1 ? 'x' : ''} posé${report.addedCount > 1 ? 's' : ''}, ajustez-les ou publiez la semaine.`}
		<a href={closeHref} class="font-medium underline">Fermer</a>
	</p>
	{#if report.unfilledGaps.length > 0}
		<ul class="mt-2 list-disc pl-5">
			{#each report.unfilledGaps as gap (gap)}
				<li class="font-medium">{gap}</li>
			{/each}
		</ul>
	{/if}
	{#if report.explanations.length > 0}
		<details class="mt-2">
			<summary class="cursor-pointer font-medium">Pourquoi ces créneaux ?</summary>
			<ul class="mt-1 list-disc pl-5">
				{#each report.explanations as explanation (explanation)}
					<li>{explanation}</li>
				{/each}
			</ul>
		</details>
	{/if}
</Alert>
