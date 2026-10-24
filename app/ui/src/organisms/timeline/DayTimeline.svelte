<script lang="ts">
	import {
		arrangeBarsInLanes,
		type DayTimelineBarTone,
		type DayTimelineHour,
		type DayTimelineNow,
		type DayTimelineRange,
		type DayTimelineRow
	} from './dayTimeline';

	type DayTimelineProps = {
		label: string;
		hours: DayTimelineHour[];
		rows: DayTimelineRow[];
		/** Les heures grisées, sur toutes les lignes : en dehors de l'ouverture. */
		closedRanges?: DayTimelineRange[];
		closedLabel?: string;
		now?: DayTimelineNow;
	};

	let { label, hours, rows, closedRanges = [], closedLabel, now }: DayTimelineProps = $props();

	const toneClasses: Record<DayTimelineBarTone, string> = {
		accent: 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent-value)]',
		neutral: 'bg-surface-muted text-ink',
		pending: 'border border-dashed border-accent bg-surface text-ink'
	};
</script>

{#snippet trackBackground()}
	{#each closedRanges as closedRange (closedRange.startPercent)}
		<span
			aria-hidden="true"
			class="absolute inset-y-0 bg-surface-muted/60"
			style:left="{closedRange.startPercent}%"
			style:width="{closedRange.widthPercent}%"
		></span>
	{/each}
	{#each hours as hour (hour.label)}
		<span aria-hidden="true" class="absolute inset-y-0 border-l border-line-soft" style:left="{hour.percent}%"></span>
	{/each}
	{#if now}
		<span aria-hidden="true" class="absolute inset-y-0 z-[2] w-0.5 -translate-x-1/2 bg-ink-muted" style:left="{now.percent}%"></span>
	{/if}
{/snippet}

<section aria-label={label} class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<div class="min-w-[640px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[132px] flex-none px-4 py-[9px]"></div>
			<div class="relative mr-6 ml-3 min-h-[34px] flex-1" aria-hidden="true">
				{#each hours as hour, hourIndex (hour.label)}
					<span
						class="absolute top-[9px] tabular-nums {hourIndex === 0 ? '' : hourIndex === hours.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}"
						style:left="{hour.percent}%"
					>
						{hour.label}
					</span>
				{/each}
			</div>
		</div>

		<ul>
			{#each rows as row (row.key)}
				{@const lanes = arrangeBarsInLanes(row.bars)}
				{@const gaps = row.gaps ?? []}
				<li data-module={row.module} class="flex border-line-soft not-last:border-b">
					<div class="w-[132px] flex-none truncate px-4 py-3 text-[12.5px] leading-[17px] font-semibold text-ink-muted">
						{row.label}
					</div>
					<div class="relative mr-6 ml-3 flex min-h-12 flex-1 flex-col justify-center gap-1 py-2">
						{@render trackBackground()}
						{#if lanes.length === 0 && row.emptyLabel}
							<p class="relative z-[1] pl-2 text-[12.5px] leading-[17px] text-ink-subtle">{row.emptyLabel}</p>
						{/if}
						{#each lanes as lane, laneIndex (laneIndex)}
							<ul class="relative z-[1] h-7">
								{#each lane as bar (bar.id)}
									<li class="absolute inset-y-0" style:left="{bar.startPercent}%" style:width="{bar.widthPercent}%">
										<svelte:element
											this={bar.href ? 'a' : 'span'}
											href={bar.href}
											title={bar.detail ? `${bar.label} · ${bar.detail}` : bar.label}
											class="flex h-full items-center gap-1.5 overflow-hidden rounded-xs px-2 text-[12px] leading-4 whitespace-nowrap no-underline {toneClasses[
												bar.tone
											]} {bar.href ? 'transition-colors duration-[120ms] hover:brightness-95' : ''}"
										>
											<span class="font-semibold">{bar.label}</span>
											{#if bar.detail}<span class="text-ink-muted tabular-nums">{bar.detail}</span>{/if}
										</svelte:element>
									</li>
								{/each}
							</ul>
						{/each}
						{#if gaps.length > 0}
							<!-- Sur sa propre voie : un trou se lit sous les barres, jamais par-dessus. -->
							<ul class="relative z-[1] h-6">
								{#each gaps as gap (gap.key)}
									<li class="absolute inset-y-0" style:left="{gap.startPercent}%" style:width="{gap.widthPercent}%">
										<span aria-hidden="true" class="absolute inset-x-0 bottom-0 h-1 rounded-full bg-danger"></span>
										<span class="block truncate pb-1.5 text-[12px] leading-4 font-semibold text-danger tabular-nums">{gap.label}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
	{#if closedLabel || now}
		<p class="border-t border-line-soft px-4 py-2 text-[12px] leading-4 text-ink-subtle">
			{#if closedLabel}<span class="mr-1 inline-block size-2.5 rounded-xs bg-surface-muted align-middle"></span>{closedLabel}{/if}
			{#if closedLabel && now} · {/if}
			{#if now}Il est {now.label}.{/if}
		</p>
	{/if}
</section>
