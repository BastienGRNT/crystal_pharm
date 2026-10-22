<script lang="ts">
	import type { Snippet } from 'svelte';
	import { findCurrentNavigationLink, type NavigationLink, type SignedInUserSummary } from './navigation';
	import SideNav from './SideNav.svelte';
	import TopBar from './TopBar.svelte';

	type AppShellProps = {
		navigationLinks: readonly NavigationLink[];
		currentPathname: string;
		signedInUser: SignedInUserSummary;
		spaceLabel?: string;
		onSignOut: () => void;
		children: Snippet;
	};

	let { navigationLinks, currentPathname, signedInUser, spaceLabel, onSignOut, children }: AppShellProps =
		$props();

	const currentNavigationLink = $derived(findCurrentNavigationLink(navigationLinks, currentPathname));
</script>

<div class="flex min-h-screen bg-app font-sans text-ink">
	<SideNav {navigationLinks} currentNavigationHref={currentNavigationLink?.href} {signedInUser} {onSignOut} />

	<div class="flex min-w-0 flex-1 flex-col" data-module={currentNavigationLink?.module}>
		<TopBar sectionLabel={currentNavigationLink?.label ?? ''} {spaceLabel} />

		<main id="contenu" class="flex flex-col gap-3.5 px-7 pt-5 pb-10 [&>*]:min-w-0 [&>*]:flex-none">
			{@render children()}
		</main>
	</div>
</div>
