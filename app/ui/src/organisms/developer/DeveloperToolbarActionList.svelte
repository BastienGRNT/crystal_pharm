<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { DeveloperToolbarAction, DeveloperToolbarActionGroup } from './developerToolbar';

	type DeveloperToolbarActionListProps = {
		actionGroups: DeveloperToolbarActionGroup[];
		actionPathname: string;
		currentPathname: string;
	};

	let { actionGroups, actionPathname, currentPathname }: DeveloperToolbarActionListProps = $props();

	const confirmationDelayInMilliseconds = 4000;

	let actionAwaitingConfirmation = $state<string | undefined>();
	let pendingActionName = $state<string | undefined>();
	let confirmationTimeout: ReturnType<typeof setTimeout> | undefined;

	// Une action destructive part au second clic : le premier ne fait qu'armer le bouton, quelques secondes.
	function submitOrAskForConfirmation(event: SubmitEvent, action: DeveloperToolbarAction): void {
		if (pendingActionName) {
			event.preventDefault();
			return;
		}
		if (action.isDestructive && actionAwaitingConfirmation !== action.actionName) {
			event.preventDefault();
			armConfirmation(action.actionName);
			return;
		}
		clearTimeout(confirmationTimeout);
		actionAwaitingConfirmation = undefined;
		pendingActionName = action.actionName;
	}

	function armConfirmation(actionName: string): void {
		clearTimeout(confirmationTimeout);
		actionAwaitingConfirmation = actionName;
		confirmationTimeout = setTimeout(() => (actionAwaitingConfirmation = undefined), confirmationDelayInMilliseconds);
	}
</script>

<div class="grid gap-5">
	{#each actionGroups as actionGroup (actionGroup.title)}
		<section class="grid gap-1" aria-label={actionGroup.title}>
			<p class="px-2 text-eyebrow text-ink-subtle">{actionGroup.title}</p>
			{#each actionGroup.actions as action (action.actionName)}
				{@const isAwaitingConfirmation = actionAwaitingConfirmation === action.actionName}
				{@const isPending = pendingActionName === action.actionName}
				<form method="POST" action={actionPathname} onsubmit={(event) => submitOrAskForConfirmation(event, action)}>
					<input type="hidden" name="actionName" value={action.actionName} />
					<input type="hidden" name="returnPathname" value={currentPathname} />
					<button
						type="submit"
						aria-busy={isPending}
						disabled={pendingActionName !== undefined && !isPending}
						class="group flex w-full cursor-pointer items-start gap-3 rounded-md border px-2.5 py-2 text-left transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50 {isAwaitingConfirmation
							? 'border-danger/45 bg-danger-soft'
							: 'border-transparent hover:border-line hover:bg-surface-subtle'}"
					>
						<span
							class="mt-px grid size-7 flex-none place-items-center rounded-sm {action.isDestructive
								? 'bg-danger-soft text-danger'
								: 'bg-accent-soft text-accent-text'}"
						>
							<Icon name={isPending ? 'clock-countdown' : action.isDestructive ? 'trash' : 'arrow-right'} size={15} />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block body-strong {isAwaitingConfirmation ? 'text-danger' : 'text-ink'}">
								{isPending ? 'En cours…' : isAwaitingConfirmation ? `Confirmer : ${action.label.toLowerCase()}` : action.label}
							</span>
							<span class="block text-small text-ink-muted">
								{isAwaitingConfirmation ? 'Cliquez encore pour lancer. Rien ne se passe sinon.' : action.description}
							</span>
						</span>
					</button>
				</form>
			{/each}
		</section>
	{/each}
</div>
