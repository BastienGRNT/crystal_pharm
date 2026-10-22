<script lang="ts">
	import Icon from './icon/Icon.svelte';
	import type { IconName } from './icon/phosphorIcons';

	type IconButtonProps = {
		icon: IconName;
		label: string;
		onclick?: () => void;
	};

	let { icon, label, onclick }: IconButtonProps = $props();
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	{onclick}
	class="inline-grid size-control-sm cursor-pointer place-items-center rounded-md text-ink-subtle hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
>
	<Icon name={icon} />
</button>
