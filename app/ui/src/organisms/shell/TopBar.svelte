<script lang="ts">
	import type { NotificationsSummary } from './navigation';
	import NotificationBell from './NotificationBell.svelte';

	type TopBarProps = {
		sectionLabel: string;
		spaceLabel?: string;
		/** Sans elles, pas de cloche. */
		notifications?: NotificationsSummary;
	};

	let { sectionLabel, spaceLabel, notifications }: TopBarProps = $props();
</script>

<div
	class="sticky top-0 z-2 flex h-topbar flex-none items-center justify-between border-b border-line bg-surface px-7 text-[13px] text-ink-muted shadow-[inset_0_3px_0_var(--accent-value)]"
>
	<p>
		{#if spaceLabel}{spaceLabel} <span class="opacity-60">/</span>{/if}
		<b class="font-semibold text-ink">{sectionLabel}</b>
	</p>
	{#if notifications}
		<NotificationBell items={notifications.items} onOpen={notifications.onOpen} />
	{/if}
</div>
