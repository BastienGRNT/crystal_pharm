<script lang="ts">
	import type { AgendaColumn, AgendaEventTone, AgendaHour } from './agendaBoard';

	type AgendaBoardProps = {
		label: string;
		hours: AgendaHour[];
		columns: AgendaColumn[];
	};

	let { label, hours, columns }: AgendaBoardProps = $props();

	// Un quart d'heure doit tenir une ligne lisible : 32px, soit 128px par heure.
	const hourHeightInPixels = 128;
	const bodyHeightInPixels = $derived(Math.max(hours.length - 1, 1) * hourHeightInPixels);
	// En dessous, la seconde ligne serait coupée à mi-hauteur : on n'en garde qu'une.
	const minimumHeightForDetailInPixels = 48;

	function hasRoomForDetail(heightPercent: number): boolean {
		return (heightPercent / 100) * bodyHeightInPixels >= minimumHeightForDetailInPixels;
	}

	const toneClasses: Record<AgendaEventTone, string> = {
		confirmed: 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent-value)]',
		pending: 'border border-dashed border-accent bg-surface text-ink',
		cancelled: 'bg-surface-muted text-ink-subtle line-through'
	};
</script>

<section aria-label={label} class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<div class="grid min-w-max" style:grid-template-columns="56px repeat({columns.length}, minmax(150px, 1fr))">
		<div class="sticky top-0 z-[2] border-b border-line bg-surface-subtle"></div>
		{#each columns as column (column.key)}
			<div
				aria-current={column.isCurrent ? 'date' : undefined}
				class="sticky top-0 z-[2] border-b border-l border-line bg-surface-subtle px-2.5 py-2 text-[12px] leading-4 font-semibold text-ink-muted {column.isCurrent
					? 'text-accent-text'
					: ''}"
			>
				<svelte:element
					this={column.href ? 'a' : 'span'}
					href={column.href}
					class="-mx-1 block truncate rounded-xs px-1 no-underline {column.href ? 'hover:bg-surface-muted' : ''}"
				>
					<span class="text-ink {column.isCurrent ? 'text-accent-text' : ''}">{column.title}</span>
					{#if column.detail}
						<span class="block font-normal text-ink-subtle">{column.detail}</span>
					{/if}
				</svelte:element>
			</div>
		{/each}

		<div class="relative" style:height="{bodyHeightInPixels}px" aria-hidden="true">
			{#each hours as hour, hourIndex (hour.label)}
				<span
					class="absolute right-2 text-[11.5px] leading-4 text-ink-subtle tabular-nums {hourIndex === 0
						? 'translate-y-1'
						: '-translate-y-1/2'}"
					style:top="{hour.percent}%"
				>
					{hour.label}
				</span>
			{/each}
		</div>

		{#each columns as column (column.key)}
			<div class="relative border-l border-line" style:height="{bodyHeightInPixels}px">
				{#each hours as hour (hour.label)}
					<span
						aria-hidden="true"
						class="absolute inset-x-0 border-t border-line-soft"
						style:top="{hour.percent}%"
					></span>
				{/each}

				<ul>
					{#each column.events as event (event.id)}
						<li
							class="absolute px-[3px] py-px"
							style:top="{event.topPercent}%"
							style:height="{event.heightPercent}%"
							style:left="{event.leftPercent}%"
							style:width="{event.widthPercent}%"
						>
							<a
								href={event.href}
								title="{event.timeLabel} · {event.title} · {event.detail}"
								class="block h-full overflow-hidden rounded-xs px-2 py-1.5 text-[12.5px] leading-[18px] no-underline transition-colors duration-[120ms] hover:brightness-95 {toneClasses[
									event.tone
								]}"
							>
								<span class="block truncate">
									<span class="font-semibold tabular-nums">{event.timeLabel}</span>
									<span class="font-medium">{event.title}</span>
									<span class="sr-only">, {event.statusLabel}</span>
								</span>
								{#if hasRoomForDetail(event.heightPercent)}
									<span class="block truncate text-ink-muted">{event.detail}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>

				{#if column.nowPercent !== undefined}
					<span
						aria-hidden="true"
						class="absolute inset-x-0 z-[1] h-0.5 -translate-y-1/2 bg-accent"
						style:top="{column.nowPercent}%"
					></span>
				{/if}
			</div>
		{/each}
	</div>
</section>
