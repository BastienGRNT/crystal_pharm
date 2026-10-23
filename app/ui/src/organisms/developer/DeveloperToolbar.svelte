<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { IconName } from '../../atoms/icons/icons';
	import type { DeveloperToolbarContent } from './developerToolbar';

	type DeveloperToolbarProps = DeveloperToolbarContent & {
		/** La page en cours : on y revient après une action. */
		currentPathname: string;
	};

	let { signedInLabel, accountGroups, actionGroups, emails, actionPathname, currentPathname }: DeveloperToolbarProps =
		$props();

	type DeveloperToolbarTab = 'accounts' | 'actions' | 'emails';

	const tabs: { tab: DeveloperToolbarTab; label: string; icon: IconName }[] = [
		{ tab: 'accounts', label: 'Comptes', icon: 'user-switch' },
		{ tab: 'actions', label: 'Actions', icon: 'arrow-counter-clockwise' },
		{ tab: 'emails', label: 'Emails', icon: 'envelope-simple' }
	];

	let isOpen = $state(false);
	let currentTab = $state<DeveloperToolbarTab>('accounts');
	let openedEmailIndex = $state<number | undefined>(0);

	const componentId = $props.id();
	const panelId = `developer-toolbar-${componentId}`;
	const sentTimeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

	function closeOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape') isOpen = false;
	}
</script>

<svelte:window onkeydown={closeOnEscape} />

<div class="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 font-sans" data-module="admin">
	{#if isOpen}
		<section
			id={panelId}
			aria-label="Outil de dev"
			class="flex max-h-[min(640px,80vh)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-lg border border-line bg-surface text-ink shadow-float"
		>
			<header class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
				<div class="min-w-0">
					<p class="title-2">Outil de dev</p>
					<p class="truncate text-small text-ink-muted">
						{signedInLabel ? `Connecté : ${signedInLabel}` : 'Personne n’est connecté ici'}
					</p>
				</div>
				<span class="rounded-xs bg-warning-soft px-1.5 text-label text-warning">DEV</span>
			</header>

			<div role="tablist" aria-label="Rubriques" class="flex gap-1 border-b border-line px-2 pt-2">
				{#each tabs as { tab, label, icon } (tab)}
					<button
						type="button"
						role="tab"
						aria-selected={currentTab === tab}
						onclick={() => (currentTab = tab)}
						class="inline-flex cursor-pointer items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-3 pb-2 text-[13px] font-semibold text-ink-muted hover:text-ink aria-selected:border-accent aria-selected:text-accent-text"
					>
						<Icon name={icon} size={15} />
						{label}
						{#if tab === 'emails' && emails.length > 0}
							<span class="rounded-full bg-surface-muted px-1.5 text-label text-ink-muted">{emails.length}</span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="flex-1 overflow-auto p-3">
				{#if currentTab === 'accounts'}
					<div class="grid gap-4">
						{#each accountGroups as accountGroup (accountGroup.title)}
							<div class="grid gap-1">
								<p class="px-1 text-label text-ink-subtle uppercase">{accountGroup.title}</p>
								{#each accountGroup.accounts as account (account.href)}
									<a
										href={account.href}
										class="flex items-start gap-2.5 rounded-md px-2 py-2 text-ink no-underline hover:bg-surface-muted"
										aria-current={account.isCurrent ? 'true' : undefined}
									>
										<Icon name={account.isCurrent ? 'check-circle' : 'sign-in'} size={18} class="mt-px text-accent-text" />
										<span class="min-w-0">
											<span class="block body-strong">{account.label}</span>
											<span class="block text-small text-ink-muted">{account.description}</span>
										</span>
									</a>
								{/each}
							</div>
						{/each}
					</div>
				{:else if currentTab === 'actions'}
					<div class="grid gap-4">
						{#each actionGroups as actionGroup (actionGroup.title)}
							<div class="grid gap-1">
								<p class="px-1 text-label text-ink-subtle uppercase">{actionGroup.title}</p>
								{#each actionGroup.actions as action (action.actionName)}
									<form method="POST" action={actionPathname}>
										<input type="hidden" name="actionName" value={action.actionName} />
										<input type="hidden" name="returnPathname" value={currentPathname} />
										<button
											type="submit"
											class="flex w-full cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-surface-muted"
										>
											<Icon
												name={action.isDestructive ? 'trash' : 'arrow-counter-clockwise'}
												size={18}
												class="mt-px {action.isDestructive ? 'text-danger' : 'text-accent-text'}"
											/>
											<span class="min-w-0">
												<span class="block body-strong text-ink">{action.label}</span>
												<span class="block text-small text-ink-muted">{action.description}</span>
											</span>
										</button>
									</form>
								{/each}
							</div>
						{:else}
							<p class="px-1 text-small text-ink-muted">Aucune action ici.</p>
						{/each}
					</div>
				{:else}
					<div class="grid gap-1.5">
						{#each emails as email, emailIndex (email.sentAt + email.to)}
							<article class="rounded-md border border-line">
								<button
									type="button"
									aria-expanded={openedEmailIndex === emailIndex}
									onclick={() => (openedEmailIndex = openedEmailIndex === emailIndex ? undefined : emailIndex)}
									class="flex w-full cursor-pointer items-start justify-between gap-2 px-3 py-2 text-left"
								>
									<span class="min-w-0">
										<span class="block truncate body-strong text-ink">{email.subject}</span>
										<span class="block truncate text-small text-ink-muted">À {email.to}</span>
									</span>
									<span class="flex-none text-small text-ink-subtle">{sentTimeFormat.format(new Date(email.sentAt))}</span>
								</button>
								{#if openedEmailIndex === emailIndex}
									<div class="grid gap-2 border-t border-line px-3 py-2">
										<p class="text-small whitespace-pre-line text-ink-muted">{email.text}</p>
										{#each email.links as link (link.url)}
											<a
												href={link.url}
												class="inline-flex items-center gap-1.5 justify-self-start rounded-sm bg-accent px-2.5 py-1.5 text-[13px] font-semibold text-on-accent no-underline hover:bg-accent-hover"
											>
												{link.label}
												<Icon name="arrow-right" size={14} />
											</a>
										{/each}
									</div>
								{/if}
							</article>
						{:else}
							<p class="px-1 text-small text-ink-muted">
								Aucun email pour l’instant. Les invitations envoyées en dev arrivent ici.
							</p>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<button
		type="button"
		aria-expanded={isOpen}
		aria-controls={panelId}
		aria-label={isOpen ? 'Fermer l’outil de dev' : 'Ouvrir l’outil de dev'}
		title="Outil de dev"
		onclick={() => (isOpen = !isOpen)}
		class="relative grid size-11 cursor-pointer place-items-center rounded-full bg-rail text-on-rail shadow-float ring-2 ring-accent hover:bg-rail-raised"
	>
		<Icon name={isOpen ? 'x' : 'wrench'} size={20} />
		{#if !isOpen && emails.length > 0}
			<span class="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-notify ring-2 ring-surface" aria-hidden="true"></span>
		{/if}
	</button>
</div>
