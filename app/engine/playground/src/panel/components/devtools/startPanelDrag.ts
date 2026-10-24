import type { PlaygroundState } from '../../state/createPlaygroundState';

const minimumVisibleSize = 80;
const panelWidth = 420;
const draggingClass = 'is-dragging-panel';

/** Pendant le déplacement, les aperçus ne reçoivent plus la souris : sinon ils l'avalent dès qu'on passe dessus. */
export function startPanelDrag(event: PointerEvent, state: PlaygroundState): void {
  if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return;
  const start = { pointerX: event.clientX, pointerY: event.clientY, ...state.panelPlacement() };
  document.body.classList.add(draggingClass);

  const move = (moveEvent: PointerEvent) => {
    state.setPanelPlacement((placement) => ({
      ...placement,
      left: clamp(start.left + moveEvent.clientX - start.pointerX, minimumVisibleSize - panelWidth, window.innerWidth - minimumVisibleSize),
      top: clamp(start.top + moveEvent.clientY - start.pointerY, 0, window.innerHeight - minimumVisibleSize / 2),
    }));
  };
  const stop = () => {
    document.body.classList.remove(draggingClass);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
