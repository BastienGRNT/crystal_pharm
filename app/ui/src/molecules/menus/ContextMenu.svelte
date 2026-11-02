<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import { dismissOnOutsidePointerDown } from '../fields/pickers/dismissOnOutsidePointerDown';
	import type { ContextMenuItem, ContextMenuItemTone, ContextMenuPosition } from './contextMenu';

	type ContextMenuProps = {
		/** Ce sur quoi porte le menu, lu par les lecteurs d'écran. */
		label: string;
		position: ContextMenuPosition;
		items: ContextMenuItem[];
		onClose: () => void;
	};

	let { label, position, items, onClose }: ContextMenuProps = $props();

	const viewportMarginPixels = 8;
	const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;

	let menuElement: HTMLDivElement | undefined = $state();
	let placement = $state<ContextMenuPosition>();

	const itemToneClasses: Record<ContextMenuItemTone, string> = {
		neutral: 'text-ink hover:bg-surface-muted focus-visible:bg-surface-muted',
		danger: 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft'
	};

	// Un menu ouvert près d'un bord ne déborde pas de la fenêtre : on le recule d'autant.
	$effect(() => {
		if (!menuElement) return;
		const { width, height } = menuElement.getBoundingClientRect();
		placement = {
			x: Math.max(viewportMarginPixels, Math.min(position.x, window.innerWidth - width - viewportMarginPixels)),
			y: Math.max(viewportMarginPixels, Math.min(position.y, window.innerHeight - height - viewportMarginPixels))
		};
		void tick().then(() => listMenuItems()[0]?.focus());
	});

	// La page qui défile sous un menu ouvert l'éloignerait de ce qu'il désigne.
	$effect(() => {
		window.addEventListener('scroll', onClose, { capture: true, passive: true });
		window.addEventListener('resize', onClose);
		window.addEventListener('blur', onClose);
		return () => {
			window.removeEventListener('scroll', onClose, { capture: true });
			window.removeEventListener('resize', onClose);
			window.removeEventListener('blur', onClose);
		};
	});

	function listMenuItems(): HTMLButtonElement[] {
		return [...(menuElement?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
	}

	function closeAndRestoreFocus(): void {
		onClose();
		previouslyFocusedElement?.focus();
	}

	function chooseItem(item: ContextMenuItem): void {
		onClose();
		item.onSelect();
	}

	function handleKeydown(event: KeyboardEvent): void {
		const menuItems = listMenuItems();
		const focusedIndex = menuItems.findIndex((menuItem) => menuItem === document.activeElement);
		const lastIndex = menuItems.length - 1;
		const moves: Record<string, () => void> = {
			ArrowDown: () => menuItems[focusedIndex >= lastIndex ? 0 : focusedIndex + 1]?.focus(),
			ArrowUp: () => menuItems[focusedIndex <= 0 ? lastIndex : focusedIndex - 1]?.focus(),
			Home: () => menuItems[0]?.focus(),
			End: () => menuItems[lastIndex]?.focus(),
			Escape: closeAndRestoreFocus,
			Tab: onClose
		};
		const move = moves[event.key];
		if (!move) return;
		if (event.key !== 'Tab') event.preventDefault();
		// Échap ne ferme que le menu, pas le panneau qui le contient.
		event.stopPropagation();
		move();
	}
</script>

<div
	bind:this={menuElement}
	role="menu"
	tabindex="-1"
	aria-label={label}
	class="fixed z-50 flex min-w-48 flex-col rounded-lg border border-line bg-surface p-1 shadow-float outline-none {placement ? '' : 'invisible'}"
	style:left="{placement?.x ?? position.x}px"
	style:top="{placement?.y ?? position.y}px"
	use:dismissOnOutsidePointerDown={onClose}
	oncontextmenu={(event) => event.preventDefault()}
	onkeydown={handleKeydown}
>
	{#each items as item (item.key)}
		<button
			type="button"
			role="menuitem"
			tabindex="-1"
			class="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-[15.5px] leading-6 outline-none {itemToneClasses[item.tone ?? 'neutral']}"
			onclick={() => chooseItem(item)}
		>
			{#if item.icon}<Icon name={item.icon} size={16} />{/if}
			<span class="flex-1">{item.label}</span>
		</button>
	{/each}
</div>
