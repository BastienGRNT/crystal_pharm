<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../../../atoms/icons/Icon.svelte';
	import Select from '../../../atoms/fields/Select.svelte';
	import { dismissOnOutsidePointerDown } from './dismissOnOutsidePointerDown';
	import { pickerOptionClasses, pickerPopoverClasses, pickerTriggerClasses } from './pickerClasses';
	import { filterComboBoxOptions, findComboBoxOptionByLabel, type ComboBoxOption } from './comboBox';

	type ComboBoxProps = {
		id: string;
		name: string;
		options: readonly ComboBoxOption[];
		placeholder: string;
		value?: string;
		emptyMessage?: string;
		required?: boolean;
		'aria-describedby'?: string;
		'aria-invalid'?: true;
	};

	let {
		id,
		name,
		options,
		placeholder,
		value = $bindable(''),
		emptyMessage = 'Aucun résultat',
		required = false,
		'aria-describedby': ariaDescribedBy,
		'aria-invalid': ariaInvalid
	}: ComboBoxProps = $props();

	const listboxId = $derived(`${id}-options`);
	// Avant que JavaScript prenne la main, une liste native garde le formulaire utilisable.
	let isEnhanced = $state(false);
	let isOpen = $state(false);
	let highlightedIndex = $state(0);
	let typedText = $state('');
	let textInputElement: HTMLInputElement | undefined = $state();

	const selectedOption = $derived(options.find((option) => option.value === value));
	const visibleOptions = $derived(filterComboBoxOptions(options, typedText));

	$effect(() => {
		isEnhanced = true;
	});

	// Le texte affiché suit l'option choisie, y compris quand l'appelant change la valeur.
	$effect(() => {
		typedText = selectedOption?.label ?? '';
	});

	function openList(): void {
		const selectedIndex = visibleOptions.findIndex((option) => option.value === value);
		highlightedIndex = Math.max(0, selectedIndex);
		isOpen = true;
	}

	function closeList(): void {
		isOpen = false;
		settleTypedText();
	}

	// Un texte qui ne désigne exactement aucune option ne reste pas affiché : on revient à l'option choisie.
	function settleTypedText(): void {
		if (typedText.trim() === '') value = '';
		const optionMatchingTypedText = findComboBoxOptionByLabel(options, typedText);
		if (optionMatchingTypedText) value = optionMatchingTypedText.value;
		typedText = selectedOption?.label ?? '';
	}

	function chooseOption(option: ComboBoxOption): void {
		value = option.value;
		typedText = option.label;
		isOpen = false;
	}

	function handleTextInput(): void {
		highlightedIndex = 0;
		isOpen = true;
	}

	async function toggleListFromButton(): Promise<void> {
		if (isOpen) {
			closeList();
			return;
		}
		typedText = '';
		openList();
		await tick();
		textInputElement?.focus();
	}

	function handleKeydown(event: KeyboardEvent): void {
		const lastIndex = visibleOptions.length - 1;
		const highlightedOption = visibleOptions[highlightedIndex];
		const moves: Record<string, (() => void) | undefined> = {
			ArrowDown: () => (isOpen ? (highlightedIndex = Math.min(lastIndex, highlightedIndex + 1)) : openList()),
			ArrowUp: () => (isOpen ? (highlightedIndex = Math.max(0, highlightedIndex - 1)) : openList()),
			// Liste fermée, Entrée garde son rôle : envoyer le formulaire.
			Enter: isOpen && highlightedOption ? () => chooseOption(highlightedOption) : undefined,
			Escape: isOpen ? closeList : undefined
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		// Échap ne ferme que la liste, pas le panneau qui la contient.
		event.stopPropagation();
		move();
	}
</script>

{#if isEnhanced}
	<div class="relative" use:dismissOnOutsidePointerDown={() => isOpen && closeList()}>
		<input type="hidden" {name} {value} />
		<div
			class="{pickerTriggerClasses} cursor-text pr-1 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] has-[[aria-invalid=true]]:border-danger"
		>
			<input
				bind:this={textInputElement}
				bind:value={typedText}
				{id}
				type="text"
				autocomplete="off"
				{placeholder}
				{required}
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={isOpen}
				aria-controls={listboxId}
				aria-activedescendant={isOpen && visibleOptions.length > 0 ? `${listboxId}-${highlightedIndex}` : undefined}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				class="w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-subtle"
				oninput={handleTextInput}
				onkeydown={handleKeydown}
				onclick={() => !isOpen && openList()}
				onblur={() => !isOpen && settleTypedText()}
			/>
			<!-- Le pointeur ne doit pas retirer le focus du champ. -->
			<button
				type="button"
				tabindex="-1"
				aria-label={isOpen ? 'Fermer la liste' : 'Afficher toute la liste'}
				class="grid size-7 shrink-0 cursor-pointer place-items-center rounded-sm text-ink-muted hover:bg-surface-muted"
				onpointerdown={(event) => event.preventDefault()}
				onclick={toggleListFromButton}
			>
				<Icon name="caret-down" size={14} />
			</button>
		</div>

		{#if isOpen}
			<ul id={listboxId} role="listbox" aria-labelledby={id} class="{pickerPopoverClasses} max-h-64 w-full overflow-auto py-1">
				{#each visibleOptions as option, optionIndex (option.value)}
					<li
						id="{listboxId}-{optionIndex}"
						role="option"
						aria-selected={option.value === value}
						data-highlighted={optionIndex === highlightedIndex}
						class={pickerOptionClasses}
						onpointerdown={(event) => event.preventDefault()}
						onpointerenter={() => (highlightedIndex = optionIndex)}
						onclick={() => chooseOption(option)}
						onkeydown={handleKeydown}
					>
						<span class="grid min-w-0 flex-1">
							<span class="truncate">{option.label}</span>
							{#if option.detail}
								<span class="truncate text-small font-normal text-ink-subtle">{option.detail}</span>
							{/if}
						</span>
						{#if option.value === value}<Icon name="check" size={14} />{/if}
					</li>
				{:else}
					<li class="px-2.5 py-1.5 text-[14px] leading-5 text-ink-subtle">{emptyMessage}</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<Select {id} {name} {value} {required} aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid}>
		<option value="" disabled>{placeholder}</option>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</Select>
{/if}
