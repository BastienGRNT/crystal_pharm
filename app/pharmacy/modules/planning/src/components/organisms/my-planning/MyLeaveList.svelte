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
	<p class="text-body text-ink-muted">Aucun congé à venir.</p>
{:else}
	<ul class="rounded-md border border-line bg-surface">
		{#each leaves as leave (leave.id)}
			<li class="flex flex-wrap items-center gap-3 px-4 py-2.5 not-last:border-b not-last:border-line-soft">
				<span class="min-w-0 flex-1 text-body">
					{leave.summary}
					{#if leave.note !== ''}<span class="block text-small text-ink-muted">« {leave.note} »</span>{/if}
				</span>
				<StatusBadge tone={statusTones[leave.status]}>{leave.statusLabel}</StatusBadge>
				{#if leave.canCancel}
					<form method="POST" action={cancelFormAction}>
						<input type="hidden" name="leaveRequestId" value={leave.id} />
						<Button type="submit" variant="ghost" icon="trash">Retirer</Button>
					</form>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
