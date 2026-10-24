<script lang="ts">
	import {
		arrangeBarsInLanes,
		type DayTimelineBarTone,
		type DayTimelineGap,
		type DayTimelineHour,
		type DayTimelineNow,
		type DayTimelineRow
	} from './dayTimeline';

	type DayTimelineProps = {
		label: string;
		hours: DayTimelineHour[];
		rows: DayTimelineRow[];
		gaps?: DayTimelineGap[];
		now?: DayTimelineNow;
	};

	let { label, hours, rows, gaps = [], now }: DayTimelineProps = $props();

	const toneClasses: Record<DayTimelineBarTone, string> = {
		accent: 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent-value)]',
		neutral: 'bg-surface-muted text-ink',
		pending: 'border border-dashed border-accent bg-surface text-ink'
	};
</script>

{#snippet trackBackground()}
	{#each hours as hour (hour.label)}
		<span aria-hidden="true" class="absolute inset-y-0 border-l border-line-soft" style:left="{hour.percent}%"></span>
	{/each}
	{#each gaps as gap (gap.key)}
		<span
			aria-hidden="true"
			class="absolute inset-y-0 border-x border-danger bg-[repeating-linear-gradient(135deg,var(--danger-soft)_0_6px,transparent_6px_12px)]"
			style:left="{gap.startPercent}%"
			style:width="{gap.widthPercent}%"
		></span>
	{/each}
	{#if now}
		<span aria-hidden="true" class="absolute inset-y-0 z-[2] w-0.5 -translate-x-1/2 bg-accent" style:left="{now.percent}%"></span>
	{/if}
{/snippet}

<section aria-label={label} class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<div class="min-w-[720px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[140px] flex-none px-4 py-[9px]"></div>
			<div class="relative mr-6 ml-3 min-h-[34px] flex-1" aria-hidden="true">
				{#each hours as hour (hour.label)}
					<span class="absolute top-[9px] -translate-x-1/2 tabular-nums" style:left="{hour.percent}%">{hour.label}</span>
				{/each}
				{#each gaps as gap (gap.key)}
					<span
						class="absolute top-[5px] z-[3] -translate-x-1/2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11.5px] leading-[14px] font-semibold whitespace-nowrap text-danger tabular-nums"
						style:left="{gap.startPercent + gap.widthPercent / 2}%"
					>
						{gap.label}
					</span>
				{/each}
			</div>
		</div>

		<ul>
			{#each rows as row (row.key)}
				{@const lanes = arrangeBarsInLanes(row.bars)}
				<li class="flex border-line-soft not-last:border-b">
					<div class="w-[140px] flex-none truncate px-4 py-3 text-[12.5px] leading-[17px] font-semibold text-ink-muted">
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
					</div>
				</li>
			{/each}
		</ul>
	</div>
	{#if now}<p class="sr-only">Il est {now.label}.</p>{/if}
	{#each gaps as gap (gap.key)}<p class="sr-only">{gap.label}</p>{/each}
</section>
