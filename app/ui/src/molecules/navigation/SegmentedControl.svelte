<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { SegmentedControlOption } from './segmentedControl';

	type SegmentedControlProps = {
		label: string;
		options: SegmentedControlOption[];
	};

	let { label, options }: SegmentedControlProps = $props();
</script>

<nav aria-label={label} class="inline-flex h-control items-center gap-0.5 rounded-control border border-line bg-surface-muted p-[3px]">
	{#each options as option (option.href)}
		<a
			href={option.href}
			aria-current={option.isCurrent ? 'page' : undefined}
			class="inline-flex h-full items-center gap-1.5 rounded-sm px-3.5 text-[14.5px] leading-5 font-bold text-ink-muted no-underline hover:text-ink aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:shadow-card"
		>
			{#if option.icon}<Icon name={option.icon} size={16} />{/if}
			{option.label}
		</a>
	{/each}
</nav>
