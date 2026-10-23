<script lang="ts">
	import Icon from '../../../atoms/icons/Icon.svelte';
	import type { IconName } from '../../../atoms/icons/icons';
	import { dismissOnOutsidePointerDown } from './dismissOnOutsidePointerDown';
	import { pickerOptionClasses, pickerPopoverClasses, pickerTriggerClasses } from './pickerClasses';
	import type { SuggestionInputOption } from './suggestionInput';

	type SuggestionInputProps = {
		id: string;
		name: string;
		value?: string;
		/** Les propositions pour le texte tapé : l'appelant les cherche, le champ les affiche. */
		suggestions: readonly SuggestionInputOption[];
		icon?: IconName;
		autocomplete?: HTMLInputElement['autocomplete'];
		required?: boolean;
		'aria-describedby'?: string;
		'aria-invalid'?: true;
		onTextInput: (text: string) => void;
		onSuggestionChoose: (suggestion: SuggestionInputOption) => void;
	};

	let {
		id,
		name,
		value = $bindable(''),
		suggestions,
		icon,
		autocomplete = 'off',
		required = false,
		'aria-describedby': ariaDescribedBy,
		'aria-invalid': ariaInvalid,
		onTextInput,
		onSuggestionChoose
	}: SuggestionInputProps = $props();

	const listboxId = $derived(`${id}-suggestions`);
	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	const isListVisible = $derived(isOpen && suggestions.length > 0);

	function handleInput(): void {
		isOpen = true;
		highlightedIndex = -1;
		onTextInput(value);
	}

	function chooseSuggestion(suggestion: SuggestionInputOption): void {
		isOpen = false;
		onSuggestionChoose(suggestion);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!isListVisible) return;

		const lastIndex = suggestions.length - 1;
		const highlightedSuggestion = suggestions[highlightedIndex];
		const moves: Record<string, (() => void) | undefined> = {
			ArrowDown: () => (highlightedIndex = Math.min(lastIndex, highlightedIndex + 1)),
			ArrowUp: () => (highlightedIndex = Math.max(0, highlightedIndex - 1)),
			// Sans proposition surlignée, Entrée garde son rôle : envoyer le formulaire.
			Enter: highlightedSuggestion ? () => chooseSuggestion(highlightedSuggestion) : undefined,
			Escape: () => (isOpen = false)
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		// Échap ne ferme que la liste, pas le panneau qui la contient.
		event.stopPropagation();
		move();
	}
</script>

<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
	<div
		class="{pickerTriggerClasses} cursor-text focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] has-[[aria-invalid=true]]:border-danger"
	>
		{#if icon}<Icon name={icon} size={16} class="text-ink-muted" />{/if}
		<input
			{id}
			{name}
			bind:value
			type="text"
			{autocomplete}
			{required}
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={isListVisible}
			aria-controls={listboxId}
			aria-activedescendant={isListVisible && highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
			aria-describedby={ariaDescribedBy}
			aria-invalid={ariaInvalid}
			class="w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-subtle"
			oninput={handleInput}
			onkeydown={handleKeydown}
		/>
	</div>

	{#if isListVisible}
		<ul id={listboxId} role="listbox" aria-labelledby={id} class="{pickerPopoverClasses} max-h-64 w-full overflow-auto py-1">
			{#each suggestions as suggestion, suggestionIndex (suggestion.key)}
				<!-- Le pointeur ne doit pas retirer le focus du champ avant le choix. -->
				<li
					id="{listboxId}-{suggestionIndex}"
					role="option"
					aria-selected={suggestionIndex === highlightedIndex}
					data-highlighted={suggestionIndex === highlightedIndex}
					class="{pickerOptionClasses} aria-selected:font-normal aria-selected:text-ink"
					onpointerdown={(event) => event.preventDefault()}
					onpointerenter={() => (highlightedIndex = suggestionIndex)}
					onclick={() => chooseSuggestion(suggestion)}
					onkeydown={handleKeydown}
				>
					<span class="grid min-w-0">
						<span class="truncate">{suggestion.label}</span>
						{#if suggestion.detail}
							<span class="truncate text-small text-ink-subtle">{suggestion.detail}</span>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
