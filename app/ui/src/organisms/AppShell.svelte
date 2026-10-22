<script lang="ts">
	import type { Snippet } from 'svelte';
	import Avatar from '../atoms/Avatar.svelte';
	import BrandMark from '../atoms/BrandMark.svelte';
	import IconButton from '../atoms/IconButton.svelte';
	import NavigationItem from '../molecules/NavigationItem.svelte';
	import ThemeToggle from '../molecules/ThemeToggle.svelte';
	import { findCurrentNavigationLocation, type NavigationSection, type SignedInUserSummary } from '../navigation';

	type AppShellProps = {
		navigationSections: readonly NavigationSection[];
		currentPathname: string;
		signedInUser: SignedInUserSummary;
		spaceLabel?: string;
		onSignOut: () => void;
		children: Snippet;
	};

	let { navigationSections, currentPathname, signedInUser, spaceLabel, onSignOut, children }: AppShellProps =
		$props();

	const currentLocation = $derived(findCurrentNavigationLocation(navigationSections, currentPathname));
</script>

<div class="flex min-h-screen bg-surface max-[800px]:flex-col">
	<nav
		aria-label="Navigation principale"
		class="sticky top-0 flex h-screen w-sidebar flex-none flex-col gap-0.5 border-r border-line bg-surface-subtle p-3 max-[800px]:static max-[800px]:h-auto max-[800px]:w-auto max-[800px]:flex-row max-[800px]:flex-wrap max-[800px]:items-center max-[800px]:border-r-0 max-[800px]:border-b max-[800px]:p-2"
	>
		<a href="/" class="flex items-center gap-2.5 px-2 pt-1.5 pb-4 text-ink max-[800px]:py-0">
			<BrandMark size={26} />
			<span>
				<b class="block text-body font-semibold">Crystal Pharm</b>
				{#if spaceLabel}
					<small class="block text-caption font-normal text-ink-subtle">{spaceLabel}</small>
				{/if}
			</span>
		</a>

		{#each navigationSections as navigationSection, sectionIndex (sectionIndex)}
			{#if navigationSection.label}
				<span class="px-2.5 pt-2.5 pb-1.5 text-overline text-ink-subtle uppercase max-[800px]:hidden">
					{navigationSection.label}
				</span>
			{/if}
			{#each navigationSection.links as navigationLink (navigationLink.href)}
				<NavigationItem {navigationLink} isCurrent={navigationLink.href === currentLocation?.link.href} />
			{/each}
		{/each}

		<span class="flex-1 max-[800px]:hidden"></span>

		<div class="mt-2 flex items-center gap-2.5 border-t border-line px-2 pt-3 pb-1 max-[800px]:mt-0 max-[800px]:border-t-0 max-[800px]:p-0">
			<Avatar name={signedInUser.name} />
			<span class="min-w-0 flex-1 max-[800px]:hidden">
				<b class="block truncate text-label font-semibold text-ink">{signedInUser.name}</b>
				<small class="block truncate text-caption font-normal text-ink-subtle">{signedInUser.detail}</small>
			</span>
			<ThemeToggle />
			<IconButton icon="sign-out" label="Se déconnecter" onclick={onSignOut} />
		</div>
	</nav>

	<div class="flex min-w-0 flex-1 flex-col" data-module={currentLocation?.link.module}>
		<div
			class="sticky top-0 z-2 flex h-topbar items-center justify-between gap-4 border-b border-line bg-surface px-8 shadow-module-bar max-[800px]:px-4"
		>
			{#if currentLocation}
				<span class="flex items-center gap-1.5 text-small text-ink-subtle">
					{#if currentLocation.sectionLabel}
						{currentLocation.sectionLabel} <i class="not-italic opacity-60">/</i>
					{/if}
					<b class="font-medium text-ink">{currentLocation.link.label}</b>
				</span>
			{/if}
		</div>
		<main id="contenu" class="grid w-full max-w-content content-start gap-6 px-8 pt-6 pb-12 max-[800px]:px-4">
			{@render children()}
		</main>
	</div>
</div>
