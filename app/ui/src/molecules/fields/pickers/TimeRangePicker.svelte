<script lang="ts">
	import Icon from '../../../atoms/icons/Icon.svelte';
	import TimePicker from './TimePicker.svelte';

	type TimeRangePickerProps = {
		id: string;
		/** Le début, au format HH:MM. */
		startTime?: string;
		/** La fin, au format HH:MM. */
		endTime?: string;
		startAccessibleLabel: string;
		endAccessibleLabel: string;
		firstTime?: string;
		lastTime?: string;
		/** Sans callback, la plage ne se retire pas. */
		onRemove?: () => void;
		removeLabel?: string;
	};

	let {
		id,
		startTime = $bindable(''),
		endTime = $bindable(''),
		startAccessibleLabel,
		endAccessibleLabel,
		firstTime,
		lastTime,
		onRemove,
		removeLabel = 'Retirer la plage'
	}: TimeRangePickerProps = $props();

	const startId = $derived(`${id}-start`);
	const endId = $derived(`${id}-end`);
</script>

<div
	class="group inline-flex h-control items-center gap-1.5 rounded-sm border border-line-strong bg-surface pl-3 tabular-nums transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] {onRemove
		? 'pr-1'
		: 'pr-3'}"
>
	<label for={startId} class="sr-only">{startAccessibleLabel}</label>
	<TimePicker id={startId} name={startId} {firstTime} {lastTime} appearance="inline" bind:value={startTime} />
	<span aria-hidden="true" class="text-ink-subtle">–</span>
	<label for={endId} class="sr-only">{endAccessibleLabel}</label>
	<TimePicker id={endId} name={endId} {firstTime} {lastTime} appearance="inline" bind:value={endTime} />
	{#if onRemove}
		<!-- Discret à la souris, toujours visible au doigt, où le survol n'existe pas. -->
		<button
			type="button"
			aria-label={removeLabel}
			title={removeLabel}
			onclick={onRemove}
			class="ml-0.5 inline-grid size-6 cursor-pointer place-items-center rounded-xs text-ink-subtle transition-opacity hover:bg-surface-muted hover:text-ink focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
		>
			<Icon name="x" size={14} />
		</button>
	{/if}
</div>
