<script lang="ts" generics="Value extends string">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { SegmentedToggleOption } from './segmentedControl';

	// Comme SegmentedControl, mais pour passer d'une vue à l'autre sans changer de page.
	type SegmentedToggleProps = {
		label: string;
		options: SegmentedToggleOption<Value>[];
		value: Value;
	};

	let { label, options, value = $bindable() }: SegmentedToggleProps = $props();
</script>

<div role="group" aria-label={label} class="inline-flex h-control items-center gap-0.5 rounded-control border border-line bg-surface-muted p-[3px]">
	{#each options as option (option.value)}
		<button
			type="button"
			aria-pressed={value === option.value}
			class="inline-flex h-full cursor-pointer items-center gap-1.5 rounded-sm px-3 text-[14.5px] leading-5 font-bold text-ink-muted hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card"
			onclick={() => (value = option.value)}
		>
			{#if option.icon}<Icon name={option.icon} size={16} />{/if}
			{option.label}
		</button>
	{/each}
</div>
