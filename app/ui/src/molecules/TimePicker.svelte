<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import Input from '../atoms/Input.svelte';
	import { dismissOnOutsidePointerDown } from './dismissOnOutsidePointerDown';
	import { pickerOptionClasses, pickerPopoverClasses, pickerTriggerClasses } from './pickerClasses';
	import { listTimeOptions, normalizeTypedTime } from './timePicker';

	type TimePickerProps = {
		id: string;
		name: string;
		/** L'heure choisie, au format HH:MM. */
		value?: string;
		firstTime?: string;
		lastTime?: string;
		stepMinutes?: number;
	};

	let {
		id,
		name,
		value = $bindable(''),
		firstTime = '06:00',
		lastTime = '22:00',
		stepMinutes = 15
	}: TimePickerProps = $props();

	const listboxId = $derived(`${id}-options`);
	// Avant que JavaScript prenne la main, un champ heure natif garde le formulaire utilisable.
	let isEnhanced = $state(false);
	let isOpen = $state(false);
	let highlightedIndex = $state(0);
	let listboxElement: HTMLUListElement | undefined = $state();

	const timeOptions = $derived(listTimeOptions(firstTime, lastTime, stepMinutes));

	$effect(() => {
		isEnhanced = true;
	});

	/** Surligne l'heure tapée, ou la première qui commence pareil. */
	function findClosestOptionIndex(typedTime: string): number {
		const normalizedTime = normalizeTypedTime(typedTime);
		const exactIndex = normalizedTime ? timeOptions.indexOf(normalizedTime) : -1;
		if (exactIndex >= 0) return exactIndex;
		const prefixIndex = timeOptions.findIndex((time) => time.startsWith(typedTime.padStart(2, '0')));
		return Math.max(0, prefixIndex);
	}

	async function openList(): Promise<void> {
		highlightedIndex = findClosestOptionIndex(value);
		isOpen = true;
		await tick();
		listboxElement
			?.querySelector<HTMLElement>(`#${CSS.escape(`${listboxId}-${highlightedIndex}`)}`)
			?.scrollIntoView({ block: 'nearest' });
	}

	function chooseTime(time: string): void {
		value = time;
		isOpen = false;
	}

	function normalizeOnBlur(): void {
		value = normalizeTypedTime(value) ?? value;
	}

	async function moveHighlight(nextIndex: number): Promise<void> {
		highlightedIndex = Math.min(timeOptions.length - 1, Math.max(0, nextIndex));
		await tick();
		listboxElement
			?.querySelector<HTMLElement>(`#${CSS.escape(`${listboxId}-${highlightedIndex}`)}`)
			?.scrollIntoView({ block: 'nearest' });
	}

	function handleInputKeydown(event: KeyboardEvent): void {
		if (!isOpen && event.key === 'ArrowDown') {
			event.preventDefault();
			void openList();
			return;
		}
		if (!isOpen) return;

		const highlightedTime = timeOptions[highlightedIndex];
		const moves: Record<string, () => void> = {
			ArrowDown: () => void moveHighlight(highlightedIndex + 1),
			ArrowUp: () => void moveHighlight(highlightedIndex - 1),
			Enter: () => highlightedTime && chooseTime(highlightedTime),
			Escape: () => (isOpen = false)
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		// Échap ne ferme que la liste, pas le panneau qui la contient.
		event.stopPropagation();
		move();
	}

	function handleInput(): void {
		if (!isOpen) isOpen = true;
		void moveHighlight(findClosestOptionIndex(value));
	}
</script>

{#if isEnhanced}
	<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
		<div class="{pickerTriggerClasses} cursor-text focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)]">
			<Icon name="clock" size={16} class="text-ink-muted" />
			<input
				{id}
				{name}
				bind:value
				type="text"
				inputmode="numeric"
				autocomplete="off"
				placeholder="hh:mm"
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={isOpen}
				aria-controls={listboxId}
				aria-activedescendant={isOpen ? `${listboxId}-${highlightedIndex}` : undefined}
				class="w-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-ink-subtle"
				onfocus={() => void openList()}
				oninput={handleInput}
				onkeydown={handleInputKeydown}
				onblur={normalizeOnBlur}
			/>
		</div>

		{#if isOpen}
			<ul
				bind:this={listboxElement}
				id={listboxId}
				role="listbox"
				aria-labelledby={id}
				class="{pickerPopoverClasses} max-h-56 w-full overflow-auto py-1"
			>
				{#each timeOptions as time, timeIndex (time)}
					<!-- Le pointeur ne doit pas retirer le focus du champ avant le choix. -->
					<li
						id="{listboxId}-{timeIndex}"
						role="option"
						aria-selected={time === value}
						data-highlighted={timeIndex === highlightedIndex}
						class="{pickerOptionClasses} tabular-nums"
						onpointerdown={(event) => event.preventDefault()}
						onpointerenter={() => (highlightedIndex = timeIndex)}
						onclick={() => chooseTime(time)}
						onkeydown={handleInputKeydown}
					>
						{time}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{:else}
	<Input {id} {name} {value} type="time" />
{/if}
