<script lang="ts">
	import Icon from '../atoms/Icon.svelte';
	import LogoMark from '../atoms/LogoMark.svelte';
	import type { ToolLink } from '../toolLinks';

	type SideNavProps = {
		toolLinks: readonly ToolLink[];
		currentToolHref: string;
	};

	let { toolLinks, currentToolHref }: SideNavProps = $props();
</script>

<nav
	aria-label="Outils"
	class="sticky top-0 flex h-screen w-rail flex-none flex-col items-center gap-1 bg-rail py-3"
>
	<a href="/" aria-label="Crystal Pharm, accueil" class="mt-0.5 mb-3">
		<LogoMark />
	</a>

	{#each toolLinks as toolLink (toolLink.href)}
		<a
			href={toolLink.href}
			data-module={toolLink.module}
			aria-current={toolLink.href === currentToolHref ? 'page' : undefined}
			class="text-rail relative grid w-[62px] justify-items-center gap-[3px] rounded-md pt-[7px] pb-1.5 text-center text-rail-ink no-underline hover:bg-rail-raised aria-[current=page]:bg-rail-raised aria-[current=page]:text-on-rail aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2.5 aria-[current=page]:before:-left-[5px] aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-[3px] aria-[current=page]:before:bg-accent-on-rail aria-[current=page]:before:content-['']"
		>
			{#if toolLink.icon}
				<Icon name={toolLink.icon} size={22} class="text-accent-on-rail" />
			{/if}
			{toolLink.label}
		</a>
	{/each}
</nav>
