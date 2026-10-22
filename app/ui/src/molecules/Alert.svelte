<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import type { IconName } from '../atoms/icons/icons';

	type AlertTone = 'danger' | 'warning' | 'success' | 'info';

	type AlertProps = {
		tone: AlertTone;
		title?: string;
		children: Snippet;
	};

	let { tone, title, children }: AlertProps = $props();

	const toneStyles: Record<AlertTone, { containerClasses: string; iconClasses: string; iconName: IconName }> = {
		danger: { containerClasses: 'border-transparent bg-danger-soft', iconClasses: 'text-danger', iconName: 'warning-circle' },
		warning: { containerClasses: 'border-transparent bg-warning-soft', iconClasses: 'text-warning', iconName: 'warning' },
		success: { containerClasses: 'border-transparent bg-success-soft', iconClasses: 'text-success', iconName: 'check' },
		info: { containerClasses: 'border-line bg-surface', iconClasses: 'text-accent-text', iconName: 'info' }
	};

	const roleByTone: Record<AlertTone, 'alert' | 'status' | undefined> = {
		danger: 'alert',
		warning: undefined,
		success: 'status',
		info: undefined
	};
</script>

<div role={roleByTone[tone]} class="flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-body text-ink {toneStyles[tone].containerClasses}">
	<Icon name={toneStyles[tone].iconName} class="mt-px {toneStyles[tone].iconClasses}" />
	<div>
		{#if title}
			<strong class="block font-semibold">{title}</strong>
		{/if}
		{@render children()}
	</div>
</div>
