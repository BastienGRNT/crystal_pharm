<script lang="ts">
	import Avatar from '../../atoms/Avatar.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import IconButton from '../../atoms/actions/IconButton.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import ThemeToggle from '../../molecules/ThemeToggle.svelte';
	import type { NavigationLink, SignedInUserSummary } from './navigation';

	type SideNavProps = {
		navigationLinks: readonly NavigationLink[];
		currentNavigationHref: string | undefined;
		hrefsNeedingAttention: readonly string[];
		signedInUser: SignedInUserSummary;
		onSignOut: () => void;
	};

	let { navigationLinks, currentNavigationHref, hrefsNeedingAttention, signedInUser, onSignOut }: SideNavProps =
		$props();
</script>

<nav
	aria-label="Navigation principale"
	class="sticky top-0 flex h-screen w-rail flex-none flex-col items-center gap-1 bg-rail py-3"
>
	<a href="/" aria-label="Crystal Pharm, accueil" class="mt-0.5 mb-3">
		<LogoMark />
	</a>

	{#each navigationLinks as navigationLink (navigationLink.href)}
		<a
			href={navigationLink.href}
			data-module={navigationLink.module}
			aria-current={navigationLink.href === currentNavigationHref ? 'page' : undefined}
			class="text-rail relative grid w-[62px] justify-items-center gap-[3px] rounded-md pt-[7px] pb-1.5 text-center text-rail-ink no-underline hover:bg-rail-raised aria-[current=page]:bg-rail-raised aria-[current=page]:text-on-rail aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2.5 aria-[current=page]:before:-left-[5px] aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-[3px] aria-[current=page]:before:bg-accent-on-rail aria-[current=page]:before:content-['']"
		>
			{#if navigationLink.icon}
				<Icon name={navigationLink.icon} size={22} class="text-accent-on-rail" />
			{/if}
			{navigationLink.label}
			{#if hrefsNeedingAttention.includes(navigationLink.href)}
				<span aria-hidden="true" class="absolute top-1.5 right-3.5 size-2 rounded-full bg-notify ring-2 ring-rail"></span>
				<span class="sr-only">, à compléter</span>
			{/if}
		</a>
	{/each}

	<span class="flex-1"></span>

	<ThemeToggle surface="rail" />
	<IconButton icon="sign-out" label="Se déconnecter" surface="rail" onclick={onSignOut} />
	<span class="mt-2" title="{signedInUser.name} · {signedInUser.detail}">
		<Avatar name={signedInUser.name} surface="rail" />
	</span>
</nav>
