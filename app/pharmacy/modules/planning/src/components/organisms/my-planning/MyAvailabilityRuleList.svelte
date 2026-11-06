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
	<p class="rounded-xl border border-dashed border-line-strong/60 px-4 py-6 text-center text-small text-ink-subtle">Aucune indisponibilité ni disponibilité renseignée.</p>
{:else}
	<ul class="divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
		{#each rules as rule (rule.id)}
			<li class="flex flex-wrap items-center gap-3 px-4 py-3">
				<span class="min-w-0 flex-1 text-body font-bold text-ink">
					{rule.summary}
					{#if rule.note !== ''}<span class="block text-small font-normal text-ink-muted italic">« {rule.note} »</span>{/if}
				</span>
				<StatusBadge tone={statusTones[rule.status]}>{statusLabels[rule.status]}</StatusBadge>
				<form method="POST" action={removeFormAction}>
					<input type="hidden" name="ruleId" value={rule.id} />
					<Button type="submit" variant="ghost" size="compact" icon="trash">Retirer</Button>
				</form>
			</li>
		{/each}
	</ul>
{/if}
