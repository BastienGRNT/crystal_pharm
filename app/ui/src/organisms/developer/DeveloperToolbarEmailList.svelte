<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { DeveloperToolbarEmail } from './developerToolbar';

	type DeveloperToolbarEmailListProps = {
		emails: DeveloperToolbarEmail[];
		/** Le plus récent envoi déjà vu : ceux d'après sont marqués comme nouveaux. */
		lastSeenSentAt: string | undefined;
	};

	let { emails, lastSeenSentAt }: DeveloperToolbarEmailListProps = $props();

	let openedEmailIndex = $state<number | undefined>(0);

	const sentTimeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
</script>

<div class="grid gap-1.5">
	{#each emails as email, emailIndex (email.sentAt + email.to)}
		{@const isNew = lastSeenSentAt === undefined || email.sentAt > lastSeenSentAt}
		<article class="rounded-md border border-line bg-surface">
			<button
				type="button"
				aria-expanded={openedEmailIndex === emailIndex}
				onclick={() => (openedEmailIndex = openedEmailIndex === emailIndex ? undefined : emailIndex)}
				class="flex w-full cursor-pointer items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-subtle"
			>
				<span class="mt-2 size-2 flex-none rounded-full {isNew ? 'bg-notify' : 'bg-transparent'}">
					{#if isNew}<span class="sr-only">Nouveau</span>{/if}
				</span>
				<span class="min-w-0 flex-1">
					<span class="block truncate body-strong text-ink">{email.subject}</span>
					<span class="block truncate text-small text-ink-muted">À {email.to}</span>
				</span>
				<span class="flex-none text-small text-ink-subtle tabular-nums">{sentTimeFormat.format(new Date(email.sentAt))}</span>
			</button>
			{#if openedEmailIndex === emailIndex}
				<div class="grid gap-2.5 border-t border-line-soft px-3 py-2.5">
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
		<div class="grid justify-items-center gap-2 rounded-md border border-dashed border-line px-4 py-8 text-center">
			<Icon name="envelope-simple" size={22} class="text-ink-subtle" />
			<p class="text-small text-ink-muted">Aucun email pour l’instant. Les invitations et relances envoyées en dev arrivent ici.</p>
		</div>
	{/each}
</div>
