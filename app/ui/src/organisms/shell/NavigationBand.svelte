<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import type { NavigationLink, NotificationsSummary, SignedInUserSummary } from './navigation';
	import NavigationCount from './NavigationCount.svelte';
	import NotificationBell from './NotificationBell.svelte';

	type NavigationBandProps = {
		navigationLinks: readonly NavigationLink[];
		accountLinks: readonly NavigationLink[];
		currentNavigationHref: string | undefined;
		hrefsNeedingAttention: readonly string[];
		countsByHref: Readonly<Record<string, number>>;
		spaceLabel?: string;
		notifications?: NotificationsSummary;
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
		notifications,
		signedInUser,
		onSignOut
	}: NavigationBandProps = $props();

	let navigationElement: HTMLElement | undefined = $state();
	let tabListElement: HTMLUListElement | undefined = $state();
	let trailingGroupElement: HTMLDivElement | undefined = $state();
	/** Indéfini tant qu'on n'a pas mesuré : les liens du compte gardent leur place sans s'afficher. */
	let doAccountLinksFit = $state<boolean>();
	let trailingGroupWidthWithAccountLinks = 0;

	// La bande ne s'élargit plus au-delà de la largeur de page : selon le nombre d'onglets, les liens
	// du compte tiennent ou non à côté. Quand ils ne tiennent pas, le menu du compte les propose déjà.
	$effect(() => {
		if (!navigationElement) return;
		void navigationLinks;
		void countsByHref;
		const updateAccountLinksFit = (): boolean => (doAccountLinksFit = measureWhetherAccountLinksFit());
		untrack(updateAccountLinksFit);
		const observer = new ResizeObserver(updateAccountLinksFit);
		observer.observe(navigationElement);
		return () => observer.disconnect();
	});

	function measureWhetherAccountLinksFit(): boolean {
		if (!navigationElement || !tabListElement || !trailingGroupElement) return true;
		if (doAccountLinksFit !== false) trailingGroupWidthWithAccountLinks = trailingGroupElement.offsetWidth;
		const widthFreedByHiddenAccountLinks = trailingGroupWidthWithAccountLinks - trailingGroupElement.offsetWidth;
		return tabListElement.scrollWidth <= navigationElement.clientWidth - widthFreedByHiddenAccountLinks;
	}

	const accountLinksVisibilityClasses = $derived(doAccountLinksFit === undefined ? 'invisible' : doAccountLinksFit ? '' : 'hidden');

	// L'onglet ouvert prend la couleur de la page : il en sort comme l'onglet d'un classeur.
	const tabClasses =
		'relative flex h-12 items-center gap-2 rounded-t-lg px-4 text-[15px] leading-5 font-semibold text-rail-ink no-underline transition-colors hover:bg-rail-raised hover:text-on-rail aria-[current=page]:bg-app aria-[current=page]:text-ink aria-[current=page]:hover:bg-app';
	const accountLinkClasses =
		'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[14px] leading-5 font-semibold text-rail-ink no-underline hover:bg-rail-raised hover:text-on-rail aria-[current=page]:bg-rail-raised aria-[current=page]:text-on-rail';
</script>

<header class="sticky top-0 z-30 bg-rail text-on-rail">
	<div class="mx-auto flex max-w-page items-end gap-6 px-8 lg:h-band max-lg:h-topbar max-lg:items-center max-lg:px-4">
		<a href="/" class="flex min-w-0 flex-none items-center gap-3 self-center no-underline max-lg:flex-1 lg:max-w-80">
			<LogoMark size={34} surface="rail" />
			<span class="grid min-w-0">
				<span class="truncate font-display text-[19px] leading-6 text-on-rail">{spaceLabel ?? 'Crystal Pharm'}</span>
				{#if spaceLabel}
					<span class="text-eyebrow text-[10.5px] leading-3 text-rail-ink">Crystal Pharm</span>
				{/if}
			</span>
		</a>

		<nav bind:this={navigationElement} aria-label="Navigation principale" class="min-w-0 flex-1 max-lg:hidden">
			<ul bind:this={tabListElement} class="flex items-end gap-1">
				{#each navigationLinks as navigationLink (navigationLink.href)}
					{@const isCurrent = navigationLink.href === currentNavigationHref}
					<li>
						<a href={navigationLink.href} aria-current={isCurrent ? 'page' : undefined} class={tabClasses}>
							{#if navigationLink.icon}
								<Icon
									name={navigationLink.icon}
									size={19}
									class="flex-none max-xl:hidden {isCurrent ? 'text-accent' : ''}"
								/>
							{/if}
							<span class="whitespace-nowrap">{navigationLink.label}</span>
							<NavigationCount
								count={countsByHref[navigationLink.href]}
								needsAttention={hrefsNeedingAttention.includes(navigationLink.href)}
							/>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div bind:this={trailingGroupElement} class="ml-auto flex flex-none items-center gap-1 self-center">
			{#if accountLinks.length > 0}
				<ul class="mr-2 flex items-center gap-0.5 max-2xl:hidden {accountLinksVisibilityClasses}">
					{#each accountLinks as accountLink (accountLink.href)}
						<li>
							<a
								href={accountLink.href}
								aria-current={accountLink.href === currentNavigationHref ? 'page' : undefined}
								class={accountLinkClasses}
							>
								{#if accountLink.icon}<Icon name={accountLink.icon} size={17} />{/if}
								{accountLink.label}
								<NavigationCount needsAttention={hrefsNeedingAttention.includes(accountLink.href)} />
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			{#if notifications}
				<NotificationBell items={notifications.items} onOpen={notifications.onOpen} />
			{/if}
			<AccountMenu {signedInUser} {onSignOut} {accountLinks} />
		</div>
	</div>
</header>
