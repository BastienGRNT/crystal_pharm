const clickMovementThresholdPixels = 4;

export type PointerDragHandlers = {
	onMove: (deltaX: number, deltaY: number, event: PointerEvent) => void;
	/** `wasDragged` est faux pour un simple clic, qui doit suivre son lien. */
	onEnd: (deltaX: number, deltaY: number, event: PointerEvent, wasDragged: boolean) => void;
};

/** Suit la souris ou le doigt depuis `startEvent` jusqu'au relâchement, même hors de l'élément. */
export function trackPointerDrag(startEvent: PointerEvent, handlers: PointerDragHandlers): void {
	if (startEvent.button !== 0) return;
	const originX = startEvent.clientX;
	const originY = startEvent.clientY;
	let wasDragged = false;

	const onPointerMove = (event: PointerEvent): void => {
		const deltaX = event.clientX - originX;
		const deltaY = event.clientY - originY;
		if (!wasDragged && Math.hypot(deltaX, deltaY) < clickMovementThresholdPixels) return;
		wasDragged = true;
		handlers.onMove(deltaX, deltaY, event);
	};

	const stopTracking = (): void => {
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerCancel);
	};

	const onPointerUp = (event: PointerEvent): void => {
		stopTracking();
		if (wasDragged) {
			// Le relâchement sur un lien déclencherait sinon son clic.
			window.addEventListener('click', (clickEvent) => clickEvent.preventDefault(), { capture: true, once: true });
		}
		handlers.onEnd(event.clientX - originX, event.clientY - originY, event, wasDragged);
	};

	const onPointerCancel = (event: PointerEvent): void => {
		stopTracking();
		handlers.onEnd(0, 0, event, false);
	};

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', onPointerUp);
	window.addEventListener('pointercancel', onPointerCancel);
}
