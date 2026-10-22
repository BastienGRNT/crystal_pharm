/** Action Svelte : appelle `onDismiss` quand on clique en dehors de l'élément (ferme une liste ouverte). */
export function dismissOnOutsidePointerDown(element: HTMLElement, onDismiss: () => void) {
	let currentOnDismiss = onDismiss;

	function handlePointerDown(event: PointerEvent): void {
		if (event.target instanceof Node && !element.contains(event.target)) currentOnDismiss();
	}

	window.addEventListener('pointerdown', handlePointerDown);

	return {
		update(nextOnDismiss: () => void): void {
			currentOnDismiss = nextOnDismiss;
		},
		destroy(): void {
			window.removeEventListener('pointerdown', handlePointerDown);
		}
	};
}
