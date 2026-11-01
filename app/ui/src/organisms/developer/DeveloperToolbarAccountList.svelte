<script lang="ts">
	import Tag from '../../atoms/Tag.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { DeveloperToolbarAccount, DeveloperToolbarAccountGroup } from './developerToolbar';

	let { accountGroups }: { accountGroups: DeveloperToolbarAccountGroup[] } = $props();

	let searchText = $state('');

	const componentId = $props.id();
	const searchId = `developer-account-search-${componentId}`;

	const visibleAccountGroups = $derived.by(() => {
		const searchedWords = normalizeForSearch(searchText).split(/\s+/).filter(Boolean);
		if (searchedWords.length === 0) return accountGroups;
		return accountGroups
			.map((accountGroup) => ({
				...accountGroup,
				accounts: accountGroup.accounts.filter((account) => matchesEveryWord(accountGroup, account, searchedWords))
			}))
			.filter((accountGroup) => accountGroup.accounts.length > 0);
	});

	function matchesEveryWord(accountGroup: DeveloperToolbarAccountGroup, account: DeveloperToolbarAccount, searchedWords: string[]): boolean {
		const searchableText = normalizeForSearch([accountGroup.title, account.label, account.description, ...account.badges].join(' '));
		return searchedWords.every((word) => searchableText.includes(word));
	}

	// « equipe » doit trouver « Équipe » : on compare sans accents ni majuscules.
	function normalizeForSearch(text: string): string {
		return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
	}
</script>

<div class="grid gap-4">
	<div class="relative">
		<label for={searchId} class="sr-only">Chercher un compte</label>
		<Icon name="magnifying-glass" size={16} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle" />
		<input
			id={searchId}
			type="search"
			bind:value={searchText}
			placeholder="Chercher : comptoir, retard, groupement…"
			autocomplete="off"
			class="h-control-sm w-full rounded-control border border-line-strong/55 bg-field pr-3 pl-9 text-[14px] text-ink placeholder:text-ink-subtle focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft-value)] focus-visible:outline-none"
		/>
	</div>

	{#each visibleAccountGroups as accountGroup (accountGroup.title)}
		<section class="grid gap-1" aria-label={accountGroup.title}>
			<p class="px-2 text-eyebrow text-ink-subtle">{accountGroup.title}</p>
			{#each accountGroup.accounts as account (account.href)}
				<a
					href={account.href}
					aria-current={account.isCurrent ? 'true' : undefined}
					class="group flex items-start gap-3 rounded-md border px-2.5 py-2 text-ink no-underline transition-colors duration-[120ms] {account.isCurrent
						? 'border-accent/45 bg-accent-soft'
						: 'border-transparent hover:border-line hover:bg-surface-subtle'}"
				>
					<Icon
						name={account.isCurrent ? 'check-circle' : 'sign-in'}
						size={18}
						class="mt-0.5 {account.isCurrent ? 'text-accent-text' : 'text-ink-subtle group-hover:text-accent-text'}"
					/>
					<span class="grid min-w-0 flex-1 gap-1">
						<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<span class="body-strong">{account.label}</span>
							{#if account.isCurrent}<Tag tone="accent">Connecté ici</Tag>{/if}
						</span>
						<span class="text-small text-ink-muted">{account.description}</span>
						{#if account.badges.length > 0}
							<span class="flex flex-wrap gap-1">
								{#each account.badges as badge (badge)}<Tag>{badge}</Tag>{/each}
							</span>
						{/if}
					</span>
				</a>
			{/each}
		</section>
	{:else}
		<p class="px-2 text-small text-ink-muted">Aucun compte ne correspond à « {searchText} ».</p>
	{/each}
</div>
