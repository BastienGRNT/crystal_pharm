<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import Select from '../atoms/Select.svelte';
	import { dismissOnOutsidePointerDown } from './dismissOnOutsidePointerDown';
	import { pickerOptionClasses, pickerPopoverClasses, pickerTriggerClasses } from './pickerClasses';
	import type { SelectMenuOption } from './selectMenu';

	type SelectMenuProps = {
		id: string;
		name: string;
		options: SelectMenuOption[];
		placeholder: string;
		value?: string;
	};

	let { id, name, options, placeholder, value = $bindable('') }: SelectMenuProps = $props();

	const listboxId = $derived(`${id}-options`);
	// Avant que JavaScript prenne la main, une liste native garde le formulaire utilisable.
	let isEnhanced = $state(false);
	let isOpen = $state(false);
	let highlightedIndex = $state(0);
	let triggerElement: HTMLButtonElement | undefined = $state();
	let listboxElement: HTMLUListElement | undefined = $state();

	const selectedOption = $derived(options.find((option) => option.value === value));

	$effect(() => {
		isEnhanced = true;
	});

	async function openList(): Promise<void> {
		const selectedIndex = options.findIndex((option) => option.value === value);
		highlightedIndex = Math.max(0, selectedIndex);
		isOpen = true;
		await tick();
		listboxElement?.focus();
	}

	function closeList(): void {
		isOpen = false;
		triggerElement?.focus();
	}

	function chooseOption(option: SelectMenuOption): void {
		value = option.value;
		closeList();
	}

	function handleTriggerKeydown(event: KeyboardEvent): void {
		if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			void openList();
		}
	}

	function handleListboxKeydown(event: KeyboardEvent): void {
		const lastIndex = options.length - 1;
		const highlightedOption = options[highlightedIndex];
		const moves: Record<string, () => void> = {
			ArrowDown: () => (highlightedIndex = Math.min(lastIndex, highlightedIndex + 1)),
			ArrowUp: () => (highlightedIndex = Math.max(0, highlightedIndex - 1)),
			Home: () => (highlightedIndex = 0),
			End: () => (highlightedIndex = lastIndex),
			Enter: () => highlightedOption && chooseOption(highlightedOption),
			' ': () => highlightedOption && chooseOption(highlightedOption),
			Escape: closeList,
			Tab: () => (isOpen = false)
		};
		const move = moves[event.key];
		if (!move) return;
		if (event.key !== 'Tab') event.preventDefault();
		// Échap ne ferme que la liste, pas le panneau qui la contient.
		event.stopPropagation();
		move();
	}
</script>

{#if isEnhanced}
	<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
		<input type="hidden" {name} {value} />
		<button
			bind:this={triggerElement}
			{id}
			type="button"
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			aria-controls={listboxId}
			class={pickerTriggerClasses}
			onclick={() => (isOpen ? closeList() : openList())}
			onkeydown={handleTriggerKeydown}
		>
			<span class="flex-1 truncate {selectedOption ? '' : 'text-ink-subtle'}">
				{selectedOption?.label ?? placeholder}
			</span>
			<Icon name="caret-down" size={14} class="text-ink-muted" />
		</button>

		{#if isOpen}
			<ul
				bind:this={listboxElement}
				id={listboxId}
				role="listbox"
				tabindex="-1"
				aria-labelledby={id}
				aria-activedescendant="{listboxId}-{highlightedIndex}"
				class="{pickerPopoverClasses} max-h-64 w-full overflow-auto py-1 outline-none"
				onkeydown={handleListboxKeydown}
			>
				{#each options as option, optionIndex (option.value)}
					<li
						id="{listboxId}-{optionIndex}"
						role="option"
						aria-selected={option.value === value}
						data-highlighted={optionIndex === highlightedIndex}
						class={pickerOptionClasses}
						onpointerenter={() => (highlightedIndex = optionIndex)}
						onclick={() => chooseOption(option)}
						onkeydown={handleListboxKeydown}
					>
						<span class="flex-1">{option.label}</span>
						{#if option.value === value}<Icon name="check" size={14} />{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<Select {id} {name} {value}>
		<option value="" disabled>{placeholder}</option>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</Select>
{/if}
