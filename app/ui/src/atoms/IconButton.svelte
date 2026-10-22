<script lang="ts">
	import Icon from './Icon.svelte';
	import type { IconName } from './icons';

	type IconButtonProps = {
		icon: IconName;
		label: string;
		surface?: 'page' | 'rail';
		onclick?: () => void;
	};

	let { icon, label, surface = 'page', onclick }: IconButtonProps = $props();

	const surfaceClasses = {
		page: 'text-ink-subtle hover:bg-surface-muted hover:text-ink',
		rail: 'text-rail-ink hover:bg-rail-raised hover:text-on-rail'
	};
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	{onclick}
	class="inline-grid size-control-sm cursor-pointer place-items-center rounded-sm {surfaceClasses[surface]}"
>
	<Icon name={icon} />
</button>
