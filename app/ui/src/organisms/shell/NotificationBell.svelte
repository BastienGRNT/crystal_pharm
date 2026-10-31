<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import { dismissOnOutsidePointerDown } from '../../molecules/fields/pickers/dismissOnOutsidePointerDown';
	import type { NotificationsSummary } from './navigation';

	let { items, onOpen }: NotificationsSummary = $props();

	const panelId = $props.id();
	let isOpen = $state(false);
	// Une fois ouverte, la cloche ne montre plus de compteur, même avant le prochain chargement.
	let hasBeenOpened = $state(false);
	let triggerElement: HTMLButtonElement | undefined = $state();

	const unreadCount = $derived(hasBeenOpened ? 0 : items.filter((item) => !item.isRead).length);

	function toggle(): void {
		isOpen = !isOpen;
		if (isOpen && !hasBeenOpened && unreadCount > 0) onOpen();
		if (isOpen) hasBeenOpened = true;
	}

	function closeOnEscape(event: KeyboardEvent): void {
		if (!isOpen || event.key !== 'Escape') return;
		event.preventDefault();
		isOpen = false;
		triggerElement?.focus();
	}
</script>

<svelte:window onkeydown={closeOnEscape} />

<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
	<button
		bind:this={triggerElement}
		type="button"
		aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : 'Notifications'}
		aria-expanded={isOpen}
		aria-controls={panelId}
		onclick={toggle}
		class="relative grid size-8 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink aria-expanded:bg-surface-muted"
	>
		<Icon name="bell" />
		{#if unreadCount > 0}
			<span
				aria-hidden="true"
				class="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-badge px-1 text-[11px] leading-none font-semibold text-on-badge"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			id={panelId}
			role="group"
			aria-label="Notifications"
			class="absolute top-full right-0 z-30 mt-1.5 w-80 rounded-md border border-line bg-surface p-1.5 font-sans text-ink shadow-float"
		>
			{#if items.length === 0}
				<p class="px-2.5 py-2 text-[13px] leading-5 text-ink-muted">Aucune notification.</p>
			{:else}
				<ul class="max-h-96 overflow-auto">
					{#each items as item (item.id)}
						<li>
							<a
								href={item.href}
								onclick={() => (isOpen = false)}
								class="flex gap-2.5 rounded-sm px-2.5 py-2 text-[14px] leading-5 text-ink no-underline hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
							>
								<span aria-hidden="true" class="mt-1.5 size-2 flex-none rounded-full {item.isRead ? '' : 'bg-accent'}"></span>
								<span class="min-w-0">
									{item.message}
									<span class="block text-[12px] leading-4 text-ink-subtle">{item.timeLabel}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
