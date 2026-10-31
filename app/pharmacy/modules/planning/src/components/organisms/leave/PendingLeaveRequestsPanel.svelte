<script lang="ts">
	import { Button, Icon, StatusBadge } from '@crystal-pharm/ui';
	import type { PendingLeaveRequestView } from '../../../pages/teamPlanningPageData';

	type PendingLeaveRequestsPanelProps = {
		requests: PendingLeaveRequestView[];
		decideFormAction: string;
	};

	let { requests, decideFormAction }: PendingLeaveRequestsPanelProps = $props();
</script>

{#if requests.length > 0}
	<section class="rounded-md border border-line bg-surface shadow-card" aria-label="Congés à valider">
		<h2 class="flex items-center gap-2 px-4 py-2 text-body font-semibold text-ink">
			<Icon name="calendar-check" class="text-accent-text" />
			Congés à valider
			<StatusBadge tone="warning">{requests.length}</StatusBadge>
		</h2>
		<ul class="border-t border-line-soft">
			{#each requests as request (request.leaveRequestId)}
				<li class="flex flex-wrap items-start gap-4 px-4 py-2 not-last:border-b not-last:border-line-soft">
					<div class="grid min-w-0 flex-1 gap-1 text-body">
						<p><span class="font-semibold">{request.employeeName}</span> : {request.summary}</p>
						{#if request.note !== ''}
							<p class="text-small text-ink-muted">« {request.note} »</p>
						{/if}
						{#if request.isTeamSufficient}
							<p><StatusBadge tone="success">Effectif suffisant</StatusBadge></p>
						{:else}
							<p><StatusBadge tone="danger">Il manquerait du monde</StatusBadge></p>
							<ul class="text-small text-ink-muted">
								{#each request.shortages as shortage (shortage)}<li>{shortage}</li>{/each}
							</ul>
						{/if}
						{#if request.overlappingRequesterNames.length > 0}
							<p class="text-small text-ink-muted">
								{request.overlappingRequesterNames.join(', ')} demande aussi des jours sur cette période : le calcul change si vous l’acceptez.
							</p>
						{/if}
					</div>
					<form method="POST" action={decideFormAction} class="flex gap-2">
						<input type="hidden" name="leaveRequestId" value={request.leaveRequestId} />
						<Button type="submit" name="decision" value="approved" icon="check">Accepter</Button>
						<Button type="submit" name="decision" value="declined" variant="ghost">Refuser</Button>
					</form>
				</li>
			{/each}
		</ul>
	</section>
{/if}
