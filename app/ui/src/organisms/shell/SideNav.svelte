<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import type { NavigationLink, SignedInUserSummary } from './navigation';
	import NavigationCount from './NavigationCount.svelte';

	type SideNavProps = {
		navigationLinks: readonly NavigationLink[];
		accountLinks: readonly NavigationLink[];
		currentNavigationHref: string | undefined;
		hrefsNeedingAttention: readonly string[];
		countsByHref: Readonly<Record<string, number>>;
		spaceLabel?: string;
		signedInUser: SignedInUserSummary;
		onSignOut: () => void;
	};

	let {
		navigationLinks,
		accountLinks,
		currentNavigationHref,
		hrefsNeedingAttention,
		countsByHref,
		spaceLabel,
		signedInUser,
		onSignOut
	}: SideNavProps = $props();

	const linkClasses =
		'relative flex h-10 items-center gap-3 rounded-md px-3 text-[15px] leading-5 font-medium text-ink-muted no-underline hover:bg-surface-muted hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-text';
</script>

<nav
	aria-label="Navigation principale"
	class="sticky top-0 z-30 flex h-dvh w-sidebar flex-none flex-col self-start border-r border-line bg-surface-subtle max-lg:hidden"
>
	<a href="/" class="flex items-center gap-2.5 px-5 pt-5 pb-4 no-underline">
		<LogoMark size={30} surface="page" />
		<span class="grid min-w-0">
			<span class="truncate text-[15.5px] leading-5 font-semibold text-ink">{spaceLabel ?? 'Crystal Pharm'}</span>
			{#if spaceLabel}
				<span class="text-[12px] leading-4 font-medium tracking-[0.04em] text-ink-subtle uppercase">Crystal Pharm</span>
			{/if}
		</span>
	</a>

	<ul class="grid gap-0.5 px-3">
		{#each navigationLinks as navigationLink (navigationLink.href)}
			<li>
				<a
					href={navigationLink.href}
					aria-current={navigationLink.href === currentNavigationHref ? 'page' : undefined}
					class={linkClasses}
				>
					{#if navigationLink.icon}
						<Icon name={navigationLink.icon} size={20} class="flex-none" />
					{/if}
					<span class="flex-1 truncate">{navigationLink.label}</span>
					<NavigationCount
						count={countsByHref[navigationLink.href]}
						needsAttention={hrefsNeedingAttention.includes(navigationLink.href)}
					/>
				</a>
			</li>
		{/each}
	</ul>

	<span class="flex-1"></span>

	{#if accountLinks.length > 0}
		<ul class="mx-3 grid gap-0.5 border-t border-line pt-3 pb-2">
			{#each accountLinks as accountLink (accountLink.href)}
				<li>
					<a
						href={accountLink.href}
						aria-current={accountLink.href === currentNavigationHref ? 'page' : undefined}
						class={linkClasses}
					>
						{#if accountLink.icon}
							<Icon name={accountLink.icon} size={20} class="flex-none" />
						{/if}
						<span class="flex-1 truncate">{accountLink.label}</span>
						<NavigationCount needsAttention={hrefsNeedingAttention.includes(accountLink.href)} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="border-t border-line p-3">
		<AccountMenu {signedInUser} {onSignOut} placement="above" />
	</div>
</nav>
