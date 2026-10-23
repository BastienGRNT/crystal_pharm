<script lang="ts">
	import Icon from '../atoms/Icon.svelte';
	import type { ToolLink } from '../toolLinks';

	let { toolLink }: { toolLink: ToolLink } = $props();
</script>

<a
	href={toolLink.href}
	data-module={toolLink.module}
	class="group grid content-start gap-2.5 rounded-md border border-line bg-surface p-4 text-ink no-underline shadow-[inset_0_var(--spacing-module-bar)_0_var(--accent-value),var(--shadow-card-value)] transition-colors duration-[120ms] hover:bg-surface-subtle"
>
	<span class="flex items-center gap-2 text-[14px] leading-5 font-semibold">
		{#if toolLink.icon}
			<span class="grid size-7 flex-none place-items-center rounded-md bg-accent-soft text-accent-text">
				<Icon name={toolLink.icon} size={16} />
			</span>
		{/if}
		{toolLink.label}
		<Icon
			name="caret-right"
			size={14}
			class="ml-auto text-ink-subtle transition-colors duration-[120ms] group-hover:text-accent-text"
		/>
	</span>
	{#if toolLink.description}
		<span class="text-[13px] leading-[18px] text-ink-muted">{toolLink.description}</span>
	{/if}
</a>
