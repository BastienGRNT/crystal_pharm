<script lang="ts">
	import type { Snippet } from 'svelte';
	import { findCurrentNavigationLink, type NavigationLink, type NotificationsSummary, type SignedInUserSummary } from './navigation';
	import SideNav from './SideNav.svelte';
	import TopBar from './TopBar.svelte';

	type AppShellProps = {
		navigationLinks: readonly NavigationLink[];
		/** Les pages du compte (réglages, abonnement…) : en accès direct au-dessus de l'avatar, à part des modules. */
		accountLinks?: readonly NavigationLink[];
		currentPathname: string;
		signedInUser: SignedInUserSummary;
		spaceLabel?: string;
		/** Les liens du menu marqués d'un point : une page qui attend une action. */
		hrefsNeedingAttention?: readonly string[];
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
		notifications,
		onSignOut,
		children
	}: AppShellProps = $props();

	const currentNavigationLink = $derived(findCurrentNavigationLink([...navigationLinks, ...accountLinks], currentPathname));
</script>

<div class="flex min-h-screen bg-app font-sans text-ink">
	<SideNav
		{navigationLinks}
		{accountLinks}
		currentNavigationHref={currentNavigationLink?.href}
		{hrefsNeedingAttention}
		{signedInUser}
		{onSignOut}
	/>

	<div class="flex min-w-0 flex-1 flex-col" data-module={currentNavigationLink?.module}>
		<TopBar sectionLabel={currentNavigationLink?.label ?? ''} {spaceLabel} {notifications} />

		<main id="contenu" class="flex flex-col gap-3.5 px-7 pt-5 pb-10 [&>*]:min-w-0 [&>*]:flex-none">
			{@render children()}
		</main>
	</div>
</div>
