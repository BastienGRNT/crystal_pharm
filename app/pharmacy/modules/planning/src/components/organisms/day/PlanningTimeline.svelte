<script lang="ts">
	import AbsenceBlock from '../../atoms/AbsenceBlock.svelte';
	import ShiftChip from '../../atoms/ShiftChip.svelte';
	import EmployeeIdentity from '../../molecules/EmployeeIdentity.svelte';
	import type {
		PlanningTimelineCoverage,
		PlanningTimelineHour,
		PlanningTimelineNow,
		PlanningTimelineOpening,
		PlanningTimelineRow
	} from './planningTimeline';

	type PlanningTimelineProps = {
		hours: PlanningTimelineHour[];
		rows: PlanningTimelineRow[];
		opening?: PlanningTimelineOpening;
		coverage?: PlanningTimelineCoverage;
		/** L'heure actuelle, seulement quand le jour affiché est aujourd'hui. */
		now?: PlanningTimelineNow;
	};

	let { hours, rows, opening, coverage, now }: PlanningTimelineProps = $props();

	// Une heure de l'axe trop proche du repère « maintenant » serait recouverte par lui.
	const minimumPercentFromNow = 4;
	const isHiddenByNowMarker = (hourPercent: number): boolean =>
		now !== undefined && Math.abs(hourPercent - now.percent) < minimumPercentFromNow;
</script>

{#snippet trackBackground()}
	{#if opening}
		<span aria-hidden="true" class="absolute inset-y-0 left-0 bg-surface-subtle" style:width="{opening.startPercent}%"></span>
		<span aria-hidden="true" class="absolute inset-y-0 right-0 bg-surface-subtle" style:width="{100 - opening.endPercent}%"></span>
	{/if}
	{#each hours as hour (hour.label)}
		<span aria-hidden="true" class="absolute inset-y-0 border-l border-line-soft" style:left="{hour.percent}%"></span>
	{/each}
	{#if now}
		<!-- Sous les créneaux : le trait ne traverse jamais leur texte. -->
		<span aria-hidden="true" class="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-danger" style:left="{now.percent}%"></span>
	{/if}
{/snippet}

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<div class="min-w-[840px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[190px] flex-none px-4 py-[9px]">Employé</div>
			<div class="relative mr-6 ml-3 flex-1" aria-hidden="true">
				{#each hours as hour (hour.label)}
					{#if !isHiddenByNowMarker(hour.percent)}
						<span class="absolute top-[9px] -translate-x-1/2 tabular-nums" style:left="{hour.percent}%">
							{hour.label}
						</span>
					{/if}
				{/each}
				{#if now}
					<span
						class="absolute top-[5px] z-10 -translate-x-1/2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11.5px] leading-[14px] font-semibold text-danger tabular-nums"
						style:left="{now.percent}%"
					>
						{now.label}
					</span>
				{/if}
			</div>
		</div>

		{#if coverage}
			<div class="flex border-b border-line bg-surface-subtle">
				<div class="w-[190px] flex-none px-4 py-2 text-[12.5px] leading-[17px] font-semibold text-ink-muted">
					{coverage.label}
				</div>
				<div class="relative mr-6 ml-3 min-h-10 flex-1">
					{@render trackBackground()}
					{#each coverage.segments as segment (segment.key)}
						<div
							class="absolute inset-y-2 z-10 flex items-center overflow-hidden rounded-xs px-2 text-[12px] leading-4 font-semibold whitespace-nowrap {segment.isCovered
								? 'bg-success-soft text-success'
								: 'bg-danger-soft text-danger shadow-[inset_0_0_0_1px_var(--danger)]'}"
							style:left="{segment.startPercent}%"
							style:width="{segment.widthPercent}%"
							title={segment.isCovered ? undefined : `${coverage.uncoveredLabel} ${segment.label}`}
						>
							{#if !segment.isCovered}<span class="sr-only">{coverage.uncoveredLabel} </span>{/if}{segment.label}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<ul>
			{#each rows as row (row.key)}
				<li class="flex border-line-soft not-last:border-b">
					<div class="w-[190px] flex-none px-4 py-2">
						<EmployeeIdentity name={row.personName} detail={row.personDetail} tag={row.personTag} hours={row.personHours} />
					</div>

					<div class="relative mr-6 ml-3 min-h-14 flex-1">
						{@render trackBackground()}

						{#if row.absence}
							<AbsenceBlock label={row.absence.label} detail={row.absence.detail} placement="timeline" />
						{:else if row.bars.length === 0}
							<p class="text-small absolute top-1/2 left-2 z-10 -translate-y-1/2 text-ink-subtle">Pas de créneau</p>
						{:else}
							{#each row.bars as bar (bar.id)}
								<ShiftChip label={bar.label} tone={bar.tone} timelinePosition={bar}>
									<span class="sr-only">{row.personName}, </span>
								</ShiftChip>
							{/each}
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
	{#if now}
		<p class="sr-only">Il est {now.label}.</p>
	{/if}
</div>
