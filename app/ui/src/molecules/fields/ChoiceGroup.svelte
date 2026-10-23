<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { ChoiceGroupOption } from './choiceGroup';

	type ChoiceGroupProps = {
		/** Le nom du champ envoyé avec le formulaire. */
		name: string;
		legend: string;
		isLegendVisible?: boolean;
		options: ChoiceGroupOption[];
		value?: string;
		/** `segmented` : une rangée compacte · `cards` : une carte par choix, avec sa description. */
		layout?: 'segmented' | 'cards';
		onchange?: (value: string) => void;
	};

	let {
		name,
		legend,
		isLegendVisible = false,
		options,
		value = $bindable(''),
		layout = 'segmented',
		onchange
	}: ChoiceGroupProps = $props();
</script>

<fieldset class="min-w-0">
	<legend class={isLegendVisible ? 'mb-[5px] text-[13px] leading-[18px] font-medium text-ink' : 'sr-only'}>{legend}</legend>
	{#if layout === 'segmented'}
		<div class="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-sm bg-surface-muted p-[3px]">
			{#each options as option (option.value)}
				<label
					class="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-xs px-3 text-[13px] leading-5 font-semibold text-ink-muted select-none hover:text-ink has-[:checked]:bg-surface has-[:checked]:text-accent-text has-[:checked]:shadow-card has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
				>
					<input type="radio" {name} value={option.value} bind:group={value} onchange={() => onchange?.(option.value)} class="sr-only" />
					{#if option.icon}<Icon name={option.icon} size={15} />{/if}
					{option.label}
				</label>
			{/each}
		</div>
	{:else}
		<div class="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
			{#each options as option (option.value)}
				<label
					class="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-surface p-3 select-none hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
				>
					<input
						type="radio"
						{name}
						value={option.value}
						bind:group={value}
						onchange={() => onchange?.(option.value)}
						class="mt-0.5 size-4 flex-none accent-[var(--accent-value)]"
					/>
					<span class="min-w-0">
						<span class="flex items-center gap-1.5 body-strong text-ink">
							{#if option.icon}<Icon name={option.icon} size={16} class="text-accent-text" />{/if}
							{option.label}
						</span>
						{#if option.description}
							<span class="mt-0.5 block text-small text-ink-muted">{option.description}</span>
						{/if}
					</span>
				</label>
			{/each}
		</div>
	{/if}
</fieldset>
