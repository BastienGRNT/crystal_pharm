<script lang="ts">
	import { Button, StatusBadge } from '@crystal-pharm/ui';
	import type { MyLeaveView } from '../../../pages/myPlanningPageData';

	type MyLeaveListProps = {
		leaves: MyLeaveView[];
		cancelFormAction: string;
	};

	let { leaves, cancelFormAction }: MyLeaveListProps = $props();

	const statusTones = { pending: 'warning', approved: 'success', declined: 'danger' } as const;
</script>

{#if leaves.length === 0}
	<p class="rounded-xl border border-dashed border-line-strong/60 px-4 py-6 text-center text-small text-ink-subtle">Aucun congé à venir.</p>
{:else}
	<ul class="divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
		{#each leaves as leave (leave.id)}
			<li class="flex flex-wrap items-center gap-3 px-4 py-3">
				<span class="min-w-0 flex-1 text-body font-bold text-ink">
					{leave.summary}
					{#if leave.note !== ''}<span class="block text-small font-normal text-ink-muted italic">« {leave.note} »</span>{/if}
				</span>
				<StatusBadge tone={statusTones[leave.status]}>{leave.statusLabel}</StatusBadge>
				{#if leave.canCancel}
					<form method="POST" action={cancelFormAction}>
						<input type="hidden" name="leaveRequestId" value={leave.id} />
						<Button type="submit" variant="ghost" size="compact" icon="trash">Retirer</Button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
