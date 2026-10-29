<script lang="ts">
	import { Button, StatusBadge } from '@crystal-pharm/ui';
	import type { MyAvailabilityRuleView } from '../../../pages/myPlanningPageData';

	type MyAvailabilityRuleListProps = {
		rules: MyAvailabilityRuleView[];
		removeFormAction: string;
	};

	let { rules, removeFormAction }: MyAvailabilityRuleListProps = $props();

	const statusLabels = { pending: 'En attente', approved: 'Acceptée', declined: 'Refusée' } as const;
	const statusTones = { pending: 'warning', approved: 'success', declined: 'danger' } as const;
</script>

{#if rules.length === 0}
	<p class="text-body text-ink-muted">Aucune indisponibilité ni disponibilité renseignée.</p>
{:else}
	<ul class="rounded-md border border-line bg-surface">
		{#each rules as rule (rule.id)}
			<li class="flex flex-wrap items-center gap-3 px-4 py-2.5 not-last:border-b not-last:border-line-soft">
				<span class="min-w-0 flex-1 text-body">
					{rule.summary}
					{#if rule.note !== ''}<span class="block text-small text-ink-muted">« {rule.note} »</span>{/if}
				</span>
				<StatusBadge tone={statusTones[rule.status]}>{statusLabels[rule.status]}</StatusBadge>
				<form method="POST" action={removeFormAction}>
					<input type="hidden" name="ruleId" value={rule.id} />
					<Button type="submit" variant="ghost" icon="trash">Retirer</Button>
				</form>
			</li>
		{/each}
	</ul>
{/if}
