<script lang="ts">
	import { onMount } from 'svelte';
	import IconButton from '../../atoms/actions/IconButton.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { IconName } from '../../atoms/icons/icons';
	import DeveloperToolbarAccountList from './DeveloperToolbarAccountList.svelte';
	import DeveloperToolbarActionList from './DeveloperToolbarActionList.svelte';
	import DeveloperToolbarContextCard from './DeveloperToolbarContextCard.svelte';
	import DeveloperToolbarEmailList from './DeveloperToolbarEmailList.svelte';
	import type { DeveloperToolbarContent, DeveloperToolbarNotice } from './developerToolbar';

	type DeveloperToolbarProps = DeveloperToolbarContent & {
		/** La page en cours : on y revient après une action. */
		currentPathname: string;
	};

	let {
		signedInLabel,
		currentContext,
		accountGroups,
		accountActionGroups,
		globalActionGroups,
		emails,
		notice,
		actionPathname,
		currentPathname
	}: DeveloperToolbarProps = $props();

	type DeveloperToolbarTab = 'context' | 'accounts' | 'demos' | 'emails';

	const tabs: { tab: DeveloperToolbarTab; label: string; icon: IconName }[] = [
		{ tab: 'context', label: 'Ce compte', icon: 'info' },
		{ tab: 'accounts', label: 'Comptes', icon: 'user-switch' },
		{ tab: 'demos', label: 'Démos', icon: 'sparkle' },
		{ tab: 'emails', label: 'Emails', icon: 'envelope-simple' }
	];

	const panelStateStorageKey = 'developer-toolbar';
	const lastSeenEmailStorageKey = 'developer-toolbar-last-seen-email';
	const successNoticeDurationInMilliseconds = 5000;

	let isOpen = $state(false);
	let currentTab = $state<DeveloperToolbarTab>('accounts');
	let isPanelStateRestored = $state(false);
	let lastSeenSentAt = $state<string | undefined>();
	let lastSeenSentAtShownInList = $state<string | undefined>();
	let visibleNotice = $state<DeveloperToolbarNotice | undefined>();

	const componentId = $props.id();
	const panelId = `developer-toolbar-${componentId}`;

	const newestSentAt = $derived(emails.reduce<string | undefined>((newest, email) => (!newest || email.sentAt > newest ? email.sentAt : newest), undefined));
	const unreadEmailCount = $derived(emails.filter((email) => lastSeenSentAt === undefined || email.sentAt > lastSeenSentAt).length);

	// Une action recharge la page : le panneau rouvre là où on était, le temps de la session.
	onMount(() => {
		const storedPanelState = readStoredPanelState();
		isOpen = storedPanelState?.isOpen ?? false;
		lastSeenSentAt = readStorage(() => localStorage.getItem(lastSeenEmailStorageKey) ?? undefined);
		openTab(storedPanelState?.tab ?? (signedInLabel ? 'context' : 'accounts'));
		isPanelStateRestored = true;
	});

	$effect(() => {
		const panelState = JSON.stringify({ isOpen, tab: currentTab });
		if (isPanelStateRestored) readStorage(() => sessionStorage.setItem(panelStateStorageKey, panelState));
	});

	$effect(() => {
		visibleNotice = notice;
		if (notice?.tone !== 'success') return;
		const hideTimeout = setTimeout(() => (visibleNotice = undefined), successNoticeDurationInMilliseconds);
		return () => clearTimeout(hideTimeout);
	});

	function openTab(tab: DeveloperToolbarTab): void {
		currentTab = tab;
		if (tab === 'emails') markEmailsAsSeen();
	}

	// La liste garde ses pastilles « nouveau » le temps de la lecture ; le compteur, lui, retombe tout de suite.
	function markEmailsAsSeen(): void {
		lastSeenSentAtShownInList = lastSeenSentAt;
		if (!newestSentAt) return;
		lastSeenSentAt = newestSentAt;
		const seenSentAt = newestSentAt;
		readStorage(() => localStorage.setItem(lastSeenEmailStorageKey, seenSentAt));
	}

	function toggleOpen(): void {
		isOpen = !isOpen;
		if (isOpen && currentTab === 'emails') markEmailsAsSeen();
	}

	function readStoredPanelState(): { isOpen: boolean; tab: DeveloperToolbarTab } | undefined {
		const storedPanelState = readStorage(() => sessionStorage.getItem(panelStateStorageKey));
		if (!storedPanelState) return undefined;
		try {
			const parsed: unknown = JSON.parse(storedPanelState);
			if (typeof parsed !== 'object' || parsed === null || !('isOpen' in parsed) || !('tab' in parsed)) return undefined;
			const tab = tabs.find((candidate) => candidate.tab === parsed.tab)?.tab;
			return tab && { isOpen: parsed.isOpen === true, tab };
		} catch {
			return undefined;
		}
	}

	// Le stockage du navigateur peut être bloqué (navigation privée) : le panneau marche alors sans mémoire.
	function readStorage<Value>(access: () => Value): Value | undefined {
		try {
			return access();
		} catch {
			return undefined;
		}
	}

	function isTypingIn(target: EventTarget | null): boolean {
		return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
	}

	// `Backquote` est la touche sous Échap, quelle que soit la disposition : ² en AZERTY, ` en QWERTY.
	function handleShortcut(event: KeyboardEvent): void {
		if (event.key === 'Escape' && isOpen) {
			isOpen = false;
			return;
		}
		if (event.code !== 'Backquote' || event.ctrlKey || event.metaKey || event.altKey || isTypingIn(event.target)) return;
		event.preventDefault();
		toggleOpen();
	}
</script>

<svelte:window onkeydown={handleShortcut} />

<div class="font-sans" data-module="admin">
	{#if isOpen}
		<section
			id={panelId}
			aria-label="Outil de dev"
			class="fixed top-0 bottom-0 left-0 z-50 flex w-[400px] max-w-[calc(100vw-16px)] animate-veil-in flex-col border-r border-line bg-app text-ink shadow-float max-lg:bottom-[var(--spacing-tabbar)]"
		>
			<header class="flex items-center gap-3 bg-rail px-4 py-3 text-on-rail">
				<span class="grid size-8 flex-none place-items-center rounded-sm bg-rail-raised text-accent-on-rail">
					<Icon name="wrench" size={17} />
				</span>
				<div class="min-w-0 flex-1">
					<p class="flex items-center gap-2 body-strong">
						Outil de dev
						<span class="rounded-xs bg-warning-on-rail px-1.5 text-label text-rail">DEV</span>
					</p>
					<p class="truncate text-small text-rail-ink">
						{signedInLabel ? `Connecté : ${signedInLabel}` : 'Personne n’est connecté ici'}
					</p>
				</div>
				<IconButton icon="x" label="Fermer l’outil de dev (Échap)" surface="rail" onclick={() => (isOpen = false)} />
			</header>

			<div role="tablist" aria-label="Rubriques" class="grid grid-cols-4 gap-1 border-b border-line bg-surface p-1.5">
				{#each tabs as { tab, label, icon } (tab)}
					<button
						type="button"
						role="tab"
						aria-selected={currentTab === tab}
						onclick={() => openTab(tab)}
						class="relative inline-flex cursor-pointer flex-col items-center gap-0.5 rounded-sm px-1 py-1.5 text-[12px] leading-4 font-semibold text-ink-muted hover:bg-surface-subtle hover:text-ink aria-selected:bg-accent-soft aria-selected:text-accent-text"
					>
						<Icon name={icon} size={17} />
						{label}
						{#if tab === 'emails' && unreadEmailCount > 0}
							<span class="absolute top-0.5 right-1.5 min-w-4 rounded-full bg-badge px-1 text-[11px] leading-4 font-bold text-on-badge tabular-nums">
								{unreadEmailCount}
							</span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="flex-1 overflow-y-auto overscroll-contain p-3">
				{#if currentTab === 'context'}
					<div class="grid gap-5">
						{#if currentContext}
							<DeveloperToolbarContextCard context={currentContext} />
						{:else}
							<div class="grid justify-items-center gap-3 rounded-md border border-dashed border-line bg-surface px-4 py-8 text-center">
								<Icon name="user-switch" size={22} class="text-ink-subtle" />
								<p class="text-small text-ink-muted">Personne n’est connecté dans cette app.</p>
								<button
									type="button"
									onclick={() => openTab('accounts')}
									class="inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 text-[13px] font-semibold text-on-accent hover:bg-accent-hover"
								>
									Choisir un compte de démo
									<Icon name="arrow-right" size={14} />
								</button>
							</div>
						{/if}
						{#if accountActionGroups.length > 0}
							<DeveloperToolbarActionList actionGroups={accountActionGroups} {actionPathname} {currentPathname} />
						{/if}
					</div>
				{:else if currentTab === 'accounts'}
					<DeveloperToolbarAccountList {accountGroups} />
				{:else if currentTab === 'demos'}
					<DeveloperToolbarActionList actionGroups={globalActionGroups} {actionPathname} {currentPathname} />
				{:else}
					<DeveloperToolbarEmailList {emails} lastSeenSentAt={lastSeenSentAtShownInList} />
				{/if}
			</div>

			<footer class="border-t border-line bg-surface px-4 py-2 text-small text-ink-subtle">
				<kbd class="rounded-xs border border-line px-1 font-sans">²</kbd> ouvre ou ferme le panneau ·
				<kbd class="rounded-xs border border-line px-1 font-sans">Échap</kbd> le ferme
			</footer>
		</section>
	{:else}
		<button
			type="button"
			aria-expanded={false}
			aria-controls={panelId}
			aria-label="Ouvrir l’outil de dev (touche ²)"
			title="Outil de dev (touche ²)"
			onclick={toggleOpen}
			class="fixed top-1/2 left-0 z-50 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-r-md bg-rail py-3 pr-1.5 pl-1 text-on-rail shadow-float hover:bg-rail-raised"
		>
			<Icon name="wrench" size={16} class="text-accent-on-rail" />
			<span class="text-[11px] leading-none font-bold tracking-[0.12em] [writing-mode:vertical-rl]">DEV</span>
			{#if unreadEmailCount > 0}
				<span class="min-w-4 rounded-full bg-badge px-1 text-[11px] leading-4 font-bold text-on-badge tabular-nums">
					<span class="sr-only">Emails non lus :</span>{unreadEmailCount}
				</span>
			{/if}
		</button>
	{/if}

	{#if visibleNotice}
		<div
			role="status"
			class="fixed top-4 left-1/2 z-50 flex w-max max-w-[min(480px,calc(100vw-32px))] -translate-x-1/2 animate-veil-in items-start gap-2.5 rounded-md border px-3.5 py-2.5 shadow-float {visibleNotice.tone ===
			'warning'
				? 'border-warning/45 bg-warning-soft text-warning'
				: 'border-success/45 bg-success-soft text-success'}"
		>
			<Icon name={visibleNotice.tone === 'warning' ? 'warning-circle' : 'check-circle'} size={18} class="mt-0.5" />
			<p class="flex-1 text-small font-semibold">{visibleNotice.message}</p>
			<button
				type="button"
				aria-label="Fermer le message"
				onclick={() => (visibleNotice = undefined)}
				class="grid size-6 flex-none cursor-pointer place-items-center rounded-xs hover:bg-surface/60"
			>
				<Icon name="x" size={14} />
			</button>
		</div>
	{/if}
</div>
