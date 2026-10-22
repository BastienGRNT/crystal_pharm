<script lang="ts">
	import type { PlanningTimelineHour, PlanningTimelineRow } from './planningTimeline';

	type PlanningTimelineProps = {
		hours: PlanningTimelineHour[];
		rows: PlanningTimelineRow[];
		/** Position de l'heure actuelle, seulement quand le jour affiché est aujourd'hui. */
		nowPercent?: number;
		nowLabel?: string;
	};

	let { hours, rows, nowPercent, nowLabel }: PlanningTimelineProps = $props();
</script>

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<div class="min-w-[840px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[190px] flex-none px-4 py-[9px]">Employé</div>
			<div class="relative mr-6 ml-3 flex-1" aria-hidden="true">
				{#each hours as hour (hour.label)}
					<span class="absolute top-[9px] -translate-x-1/2 tabular-nums" style:left="{hour.percent}%">
						{hour.label}
					</span>
				{/each}
			</div>
		</div>

		<ul>
			{#each rows as row (row.key)}
				<li class="flex border-line-soft not-last:border-b">
					<div class="w-[190px] flex-none px-4 py-2">
						<b class="block font-semibold text-ink">
							{row.personName}
							{#if row.personTag}
								<span
									class="ml-0.5 inline-flex rounded-xs bg-surface-muted px-[5px] text-[11px] leading-4 font-medium text-ink-muted"
								>
									{row.personTag}
								</span>
							{/if}
						</b>
						<small class="text-small block text-ink-subtle">{row.personDetail}</small>
					</div>

					<div class="relative mr-6 ml-3 min-h-14 flex-1">
						{#each hours as hour (hour.label)}
							<span
								aria-hidden="true"
								class="absolute inset-y-0 border-l border-line-soft"
								style:left="{hour.percent}%"
							></span>
						{/each}

						{#if row.absence}
							<div
								class="absolute inset-y-1.5 right-0 left-0 rounded-xs bg-absence px-2 py-1 text-[12.5px] text-on-absence"
							>
								<b>{row.absence.label}</b> · {row.absence.detail}
							</div>
						{:else if row.bars.length === 0}
							<p class="text-small absolute top-1/2 left-2 -translate-y-1/2 text-ink-subtle">Pas de créneau</p>
						{:else}
							{#each row.bars as bar (bar.id)}
								<div
									class="text-slot absolute inset-y-2.5 flex items-center overflow-hidden rounded-xs bg-accent-soft px-2 whitespace-nowrap text-ink shadow-[inset_2px_0_0_var(--accent-value)]"
									style:left="{bar.startPercent}%"
									style:width="{bar.widthPercent}%"
								>
									<span class="sr-only">{row.personName}, </span>{bar.label}
								</div>
							{/each}
						{/if}

						{#if nowPercent !== undefined}
							<span
								aria-hidden="true"
								class="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-accent"
								style:left="{nowPercent}%"
							></span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
	{#if nowPercent !== undefined && nowLabel}
		<p class="sr-only">{nowLabel}</p>
	{/if}
</div>
