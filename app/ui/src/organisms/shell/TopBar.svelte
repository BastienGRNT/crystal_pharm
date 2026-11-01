<script lang="ts">
	import LogoMark from '../../atoms/LogoMark.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import type { NavigationLink, NotificationsSummary, SignedInUserSummary } from './navigation';
	import NotificationBell from './NotificationBell.svelte';

	type TopBarProps = {
		sectionLabel: string;
		spaceLabel?: string;
		/** Sans elles, pas de cloche. */
		notifications?: NotificationsSummary;
		signedInUser: SignedInUserSummary;
		accountLinks: readonly NavigationLink[];
		onSignOut: () => void;
	};

	let { sectionLabel, spaceLabel, notifications, signedInUser, accountLinks, onSignOut }: TopBarProps = $props();
</script>

<div
	class="sticky top-0 z-20 flex h-topbar flex-none items-center justify-between gap-3 border-b border-line bg-surface/95 px-7 backdrop-blur max-lg:px-4"
>
	<p class="flex min-w-0 items-center gap-2 text-[14px] leading-5 text-ink-muted">
		<span class="lg:hidden"><LogoMark size={24} surface="page" /></span>
		{#if spaceLabel}
			<span class="truncate max-lg:font-semibold max-lg:text-ink">{spaceLabel}</span>
			<span class="opacity-50 max-lg:hidden">/</span>
		{/if}
		<b class="truncate font-semibold text-ink max-lg:hidden">{sectionLabel}</b>
	</p>
	<div class="flex flex-none items-center gap-1.5">
		{#if notifications}
			<NotificationBell items={notifications.items} onOpen={notifications.onOpen} />
		{/if}
		<div class="lg:hidden">
			<AccountMenu {signedInUser} {onSignOut} {accountLinks} placement="below" />
		</div>
	</div>
</div>
