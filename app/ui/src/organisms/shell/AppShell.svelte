<script lang="ts">
	import type { Snippet } from 'svelte';
	import { findCurrentNavigationLink, type NavigationLink, type NotificationsSummary, type SignedInUserSummary } from './navigation';
	import NavigationBand from './NavigationBand.svelte';
	import TabBar from './TabBar.svelte';

	type AppShellProps = {
		navigationLinks: readonly NavigationLink[];
		/** Les pages du compte (réglages, abonnement…) : à droite du bandeau, à part des modules. */
		accountLinks?: readonly NavigationLink[];
		currentPathname: string;
		signedInUser: SignedInUserSummary;
		spaceLabel?: string;
		/** Les liens du menu marqués d'un point : une page qui attend une action. */
		hrefsNeedingAttention?: readonly string[];
		/** Ce qui attend dans chaque page, affiché en pastille à côté du lien. */
		countsByHref?: Readonly<Record<string, number>>;
		/** La cloche du bandeau ; absente, pas de cloche. */
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

<div class="flex min-h-dvh flex-col bg-app font-sans text-ink">
	<NavigationBand
		{navigationLinks}
		{accountLinks}
		currentNavigationHref={currentNavigationLink?.href}
		{hrefsNeedingAttention}
		{countsByHref}
		{spaceLabel}
		{notifications}
		{signedInUser}
		{onSignOut}
	/>

	<main
		id="contenu"
		data-module={currentNavigationLink?.module}
		class="mx-auto flex w-full max-w-page flex-1 flex-col gap-5 px-8 pt-7 pb-14 max-lg:px-4 max-lg:pt-5 max-lg:pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+24px)] [&>*]:min-w-0 [&>*]:flex-none"
	>
		{@render children()}
	</main>

	<TabBar {navigationLinks} currentNavigationHref={currentNavigationLink?.href} {hrefsNeedingAttention} {countsByHref} />
</div>
