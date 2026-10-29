<script lang="ts">
	import { Button, Icon, StatusBadge } from '@crystal-pharm/ui';
	import type { PendingAvailabilityRequestView } from '../../../pages/teamPlanningPageData';

	type PendingAvailabilityRequestsPanelProps = {
		requests: PendingAvailabilityRequestView[];
		decideFormAction: string;
	};

	let { requests, decideFormAction }: PendingAvailabilityRequestsPanelProps = $props();
</script>

{#if requests.length > 0}
	<section class="rounded-md border border-line bg-surface shadow-card" aria-label="Demandes à traiter">
		<h2 class="flex items-center gap-2.5 px-4 py-2.5 text-body font-semibold text-ink">
			<Icon name="clock" class="text-accent-text" />
			À traiter
			<StatusBadge tone="warning">{requests.length}</StatusBadge>
		</h2>
		<ul class="border-t border-line-soft">
			{#each requests as request (request.ruleId)}
				<li class="flex flex-wrap items-center gap-3 px-4 py-2.5 not-last:border-b not-last:border-line-soft">
					<span class="min-w-0 flex-1 text-body">
						<span class="font-semibold">{request.employeeName}</span> : {request.summary}
						{#if request.note !== ''}
							<span class="block text-small text-ink-muted">« {request.note} »</span>
						{/if}
					</span>
					<form method="POST" action={decideFormAction} class="flex gap-2">
						<input type="hidden" name="ruleId" value={request.ruleId} />
						<Button type="submit" name="decision" value="approved" icon="check">Accepter</Button>
						<Button type="submit" name="decision" value="declined" variant="ghost">Refuser</Button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}
