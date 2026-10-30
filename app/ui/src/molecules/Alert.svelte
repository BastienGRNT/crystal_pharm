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

	type AlertToneStyle = {
		containerClasses: string;
		iconClasses: string;
		iconName: IconName;
		role?: 'alert' | 'status';
	};

	const toneStyles: Record<AlertTone, AlertToneStyle> = {
		danger: {
			containerClasses: 'border-transparent bg-danger-soft',
			iconClasses: 'text-danger',
			iconName: 'warning-circle',
			role: 'alert'
		},
		warning: { containerClasses: 'border-transparent bg-warning-soft', iconClasses: 'text-warning', iconName: 'warning' },
		success: {
			containerClasses: 'border-transparent bg-success-soft',
			iconClasses: 'text-success',
			iconName: 'check',
			role: 'status'
		},
		info: { containerClasses: 'border-line bg-surface', iconClasses: 'text-accent-text', iconName: 'info' }
	};

	const toneStyle = $derived(toneStyles[tone]);
</script>

<div role={toneStyle.role} class="flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-body text-ink {toneStyle.containerClasses}">
	<Icon name={toneStyle.iconName} class="mt-px {toneStyle.iconClasses}" />
	<div>
		{#if title}
			<strong class="block font-semibold">{title}</strong>
		{/if}
		{@render children()}
	</div>
</div>
