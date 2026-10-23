<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import type { NavigationLink, SignedInUserSummary } from './navigation';

	type SideNavProps = {
		navigationLinks: readonly NavigationLink[];
		accountLinks: readonly NavigationLink[];
		currentNavigationHref: string | undefined;
		hrefsNeedingAttention: readonly string[];
		signedInUser: SignedInUserSummary;
		onSignOut: () => void;
	};

	let {
		navigationLinks,
		accountLinks,
		currentNavigationHref,
		hrefsNeedingAttention,
		signedInUser,
		onSignOut
	}: SideNavProps = $props();
</script>

<nav
	aria-label="Navigation principale"
	class="sticky top-0 z-30 flex h-screen w-rail flex-none flex-col items-center gap-1 bg-rail py-3"
>
	<a href="/" aria-label="Crystal Pharm, accueil" class="mt-0.5 mb-3">
		<LogoMark />
	</a>

	{#each navigationLinks as navigationLink (navigationLink.href)}
		<a
			href={navigationLink.href}
			data-module={navigationLink.module}
			aria-current={navigationLink.href === currentNavigationHref ? 'page' : undefined}
			class="text-rail relative grid w-[calc(var(--spacing-rail)-10px)] justify-items-center gap-[3px] rounded-md pt-[7px] pb-1.5 text-center text-rail-ink no-underline hover:bg-rail-raised aria-[current=page]:bg-rail-raised aria-[current=page]:text-on-rail aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2.5 aria-[current=page]:before:-left-[5px] aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-[3px] aria-[current=page]:before:bg-accent-on-rail aria-[current=page]:before:content-['']"
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

	{#if accountLinks.length > 0}
		<ul class="mb-1 grid justify-items-center gap-1 border-t border-rail-raised px-1.5 pt-2.5">
			{#each accountLinks as accountLink (accountLink.href)}
				<li>
					<a
						href={accountLink.href}
						aria-label={accountLink.label}
						title={accountLink.label}
						aria-current={accountLink.href === currentNavigationHref ? 'page' : undefined}
						class="relative grid size-control place-items-center rounded-md text-rail-ink hover:bg-rail-raised hover:text-on-rail aria-[current=page]:bg-rail-raised aria-[current=page]:text-on-rail"
					>
						{#if accountLink.icon}
							<Icon name={accountLink.icon} size={20} />
						{/if}
						{#if hrefsNeedingAttention.includes(accountLink.href)}
							<span aria-hidden="true" class="absolute top-1 right-1 size-2 rounded-full bg-notify ring-2 ring-rail"></span>
							<span class="sr-only">, à compléter</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<AccountMenu {signedInUser} {onSignOut} />
</nav>
