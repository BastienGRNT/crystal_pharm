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
			containerClasses: 'border-danger/30 bg-danger-soft',
			iconClasses: 'text-danger',
			iconName: 'warning-circle',
			role: 'alert'
		},
		warning: { containerClasses: 'border-warning/30 bg-warning-soft', iconClasses: 'text-warning', iconName: 'warning' },
		success: {
			containerClasses: 'border-success/30 bg-success-soft',
			iconClasses: 'text-success',
			iconName: 'check',
			role: 'status'
		},
		info: { containerClasses: 'border-line bg-surface', iconClasses: 'text-accent-text', iconName: 'info' }
	};

	const toneStyle = $derived(toneStyles[tone]);
</script>

<div role={toneStyle.role} class="flex items-start gap-3 rounded-lg border px-4 py-3 text-body text-ink {toneStyle.containerClasses}">
	<Icon name={toneStyle.iconName} size={20} class="mt-0.5 flex-none {toneStyle.iconClasses}" />
	<div>
		{#if title}
			<strong class="block font-bold">{title}</strong>
		{/if}
		{@render children()}
	</div>
</div>
