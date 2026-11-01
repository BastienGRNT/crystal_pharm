<script lang="ts">
	import Button from '../atoms/actions/Button.svelte';
	import type { ActionListItem, ActionListTone } from './actionList';

	type ActionListProps = {
		label: string;
		items: ActionListItem[];
	};

	let { label, items }: ActionListProps = $props();

	const markerClasses: Record<ActionListTone, string> = {
		danger: 'bg-danger',
		warning: 'bg-warning',
		neutral: 'bg-line-strong'
	};
</script>

<ul aria-label={label} class="divide-y divide-line-soft">
	{#each items as item (item.id)}
		<li class="relative flex flex-wrap items-center gap-x-4 gap-y-2.5 py-3 pr-4 pl-5">
			<!-- Le liseré de gauche dit l'urgence d'un coup d'œil, avant même de lire. -->
			<span aria-hidden="true" class="absolute inset-y-2 left-0 w-1 rounded-r-full {markerClasses[item.tone]}"></span>
			<div class="min-w-48 flex-1">
				<p class="text-[15px] leading-5 font-bold text-ink">{item.title}</p>
				{#if item.detail}<p class="mt-0.5 text-small text-ink-muted">{item.detail}</p>{/if}
			</div>
			{#if item.actions.length > 0}
				<form method="POST" class="ml-auto flex flex-none flex-wrap gap-1.5">
					{#each item.actions as action (action.label)}
						{#if 'href' in action}
							<Button href={action.href} size="compact" variant={action.isPrimary ? 'primary' : 'secondary'}>{action.label}</Button>
						{:else}
							<Button
								type="submit"
								size="compact"
								formaction={action.formAction}
								name={action.name}
								value={action.value}
								variant={action.isPrimary ? 'primary' : 'secondary'}
							>
								{action.label}
							</Button>
						{/if}
					{/each}
				</form>
			{/if}
		</li>
	{/each}
</ul>
