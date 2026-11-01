<script lang="ts">
	import type { Snippet } from 'svelte';
	import { findCurrentNavigationLink, type NavigationLink, type NotificationsSummary, type SignedInUserSummary } from './navigation';
	import SideNav from './SideNav.svelte';
	import TabBar from './TabBar.svelte';
	import TopBar from './TopBar.svelte';

	type AppShellProps = {
		navigationLinks: readonly NavigationLink[];
		/** Les pages du compte (réglages, abonnement…) : sous les modules, à part. */
		accountLinks?: readonly NavigationLink[];
		currentPathname: string;
		signedInUser: SignedInUserSummary;
		spaceLabel?: string;
		/** Les liens du menu marqués d'un point : une page qui attend une action. */
		hrefsNeedingAttention?: readonly string[];
		/** Ce qui attend dans chaque page, affiché en pastille à côté du lien. */
		countsByHref?: Readonly<Record<string, number>>;
		/** La cloche de la barre du haut ; absente, pas de cloche. */
		notifications?: NotificationsSummary;
		onSignOut: () => void;
		children: Snippet;
	};

	let {
		navigationLinks,
		accountLinks = [],
		currentPathname,
		signedInUser,
		spaceLabel,
		hrefsNeedingAttention = [],
		countsByHref = {},
		notifications,
		onSignOut,
		children
	}: AppShellProps = $props();

	const currentNavigationLink = $derived(findCurrentNavigationLink([...navigationLinks, ...accountLinks], currentPathname));
</script>

<div class="flex min-h-dvh bg-app font-sans text-ink">
	<SideNav
		{navigationLinks}
		{accountLinks}
		currentNavigationHref={currentNavigationLink?.href}
		{hrefsNeedingAttention}
		{countsByHref}
		{spaceLabel}
		{signedInUser}
		{onSignOut}
	/>

	<div class="flex min-w-0 flex-1 flex-col" data-module={currentNavigationLink?.module}>
		<TopBar sectionLabel={currentNavigationLink?.label ?? ''} {spaceLabel} {notifications} {signedInUser} {accountLinks} {onSignOut} />

		<main
			id="contenu"
			class="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-8 pt-6 pb-12 max-lg:px-4 max-lg:pt-4 max-lg:pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+24px)] [&>*]:min-w-0 [&>*]:flex-none"
		>
			{@render children()}
		</main>
	</div>

	<TabBar {navigationLinks} currentNavigationHref={currentNavigationLink?.href} {hrefsNeedingAttention} {countsByHref} />
</div>
