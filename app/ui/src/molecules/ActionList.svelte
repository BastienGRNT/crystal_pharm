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
		<li class="flex gap-3 px-4 py-3.5">
			<span aria-hidden="true" class="mt-[7px] size-2 flex-none rounded-full {markerClasses[item.tone]}"></span>
			<div class="grid min-w-0 flex-1 gap-2.5">
				<div class="min-w-0">
					<p class="text-[14px] leading-5 font-semibold text-ink">{item.title}</p>
					{#if item.detail}<p class="text-small text-ink-subtle">{item.detail}</p>{/if}
				</div>
				{#if item.actions.length > 0}
					<form method="POST" class="flex flex-wrap gap-2">
						{#each item.actions as action (action.label)}
							{#if 'href' in action}
								<Button href={action.href} variant={action.isPrimary ? 'primary' : 'secondary'}>{action.label}</Button>
							{:else}
								<Button
									type="submit"
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
			</div>
		</li>
	{/each}
</ul>
