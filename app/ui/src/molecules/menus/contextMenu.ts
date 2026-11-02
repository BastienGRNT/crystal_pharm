import type { IconName } from '../../atoms/icons/icons';

export type ContextMenuItemTone = 'neutral' | 'danger';

export type ContextMenuItem = {
	key: string;
	label: string;
	icon?: IconName;
	/** `danger` pour une action qu'on ne rattrape pas, comme une suppression. */
	tone?: ContextMenuItemTone;
	onSelect: () => void;
};

/** Le coin haut gauche voulu pour le menu, en pixels de la fenêtre. */
export type ContextMenuPosition = { x: number; y: number };

/**
 * L'endroit où ouvrir le menu d'un clic droit. Ouvert au clavier (touche Menu, Maj+F10),
 * l'événement n'a pas de pointeur : le menu s'ouvre alors sous l'élément visé.
 */
export function readContextMenuPosition(event: MouseEvent): ContextMenuPosition {
	const isOpenedFromKeyboard = event.clientX === 0 && event.clientY === 0;
	if (!isOpenedFromKeyboard || !(event.currentTarget instanceof Element)) return { x: event.clientX, y: event.clientY };
	const { left, bottom } = event.currentTarget.getBoundingClientRect();
	return { x: left, y: bottom };
}
