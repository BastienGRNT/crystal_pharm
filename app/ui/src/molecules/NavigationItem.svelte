<script lang="ts">
	import Icon from '../atoms/icon/Icon.svelte';
	import type { NavigationLink } from '../navigation';

	type NavigationItemProps = {
		navigationLink: NavigationLink;
		isCurrent: boolean;
	};

	let { navigationLink, isCurrent }: NavigationItemProps = $props();
</script>

<a
	href={navigationLink.href}
	data-module={navigationLink.module}
	aria-current={isCurrent ? 'page' : undefined}
	class="flex h-control-md items-center gap-2.5 rounded-md px-2.5 text-body leading-none font-medium text-ink-muted transition-colors duration-120 hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-ink"
>
	<span class="text-accent-text"><Icon name={navigationLink.icon} /></span>
	{navigationLink.label}
</a>
