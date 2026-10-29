<script lang="ts">
	import { Button, Icon, StatusBadge } from '@crystal-pharm/ui';
	import type { PlanningIssue } from '../../../domain/issues/planningIssues';

	type PlanningIssuesPanelProps = {
		issues: PlanningIssue[];
		/** Dans la vue semaine, chaque alerte mène à sa journée. */
		linksToDay: boolean;
		dayHrefPrefix: string;
		/** Action qui complète le planning autour de ce qui est déjà posé. */
		adaptFormAction: string;
	};

	let { issues, linksToDay, dayHrefPrefix, adaptFormAction }: PlanningIssuesPanelProps = $props();

	const alertCount = $derived(issues.filter((issue) => issue.severity === 'alert').length);
</script>

{#if issues.length === 0}
	<p class="flex items-center gap-2 text-body text-success">
		<Icon name="check-circle" />
		Tout est bon : l’effectif, les contrats et les règles de la pharmacie sont respectés.
	</p>
{:else}
	<details class="rounded-md border border-line bg-surface shadow-card" open={alertCount > 0}>
		<summary class="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-ink">
			<Icon name="warning" class={alertCount > 0 ? 'text-danger' : 'text-warning'} />
			À vérifier
			<StatusBadge tone={alertCount > 0 ? 'danger' : 'warning'}>{issues.length}</StatusBadge>
		</summary>
		<div class="flex items-center gap-3 border-t border-line-soft px-4 py-2.5">
			<form method="POST" action={adaptFormAction}>
				<Button type="submit" icon="sparkle">Adapter le reste du planning</Button>
			</form>
			<p class="text-small text-ink-muted">Complète ce qui manque autour de vos changements, sans rien déplacer ni toucher aux jours passés.</p>
		</div>
		<ul class="border-t border-line-soft">
			{#each issues as issue (issue.key)}
				<li class="flex items-start gap-2.5 px-4 py-2 text-body not-last:border-b not-last:border-line-soft">
					<span class="mt-1.5 size-2 flex-none rounded-full {issue.severity === 'alert' ? 'bg-danger' : 'bg-warning'}" aria-hidden="true"></span>
					<span class="flex-1">
						<span class="sr-only">{issue.severity === 'alert' ? 'Alerte : ' : 'À noter : '}</span>{issue.message}
					</span>
					{#if linksToDay}
						<a href="{dayHrefPrefix}{issue.date}" class="text-small font-medium text-accent-text hover:underline">Voir la journée</a>
					{/if}
				</li>
			{/each}
		</ul>
	</details>
{/if}
