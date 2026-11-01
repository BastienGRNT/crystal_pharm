<script lang="ts">
	import Icon from '../icons/Icon.svelte';

	type ResizeHandleProps = {
		label: string;
		/** La taille réglée, en pixels, pour les lecteurs d'écran. */
		value: number;
		minimum: number;
		maximum: number;
		/** Le déplacement depuis le dernier appel, en pixels d'écran (positif vers la droite). */
		onmove: (deltaInPixels: number) => void;
		onresizestart?: () => void;
		onresizeend?: () => void;
		/** Un double clic revient à la taille par défaut. */
		onreset?: () => void;
	};

	let { label, value, minimum, maximum, onmove, onresizestart, onresizeend, onreset }: ResizeHandleProps = $props();

	const keyboardStepInPixels = 16;
	const largeKeyboardStepInPixels = 80;

	let lastPointerX: number | undefined = $state();

	function startDragging(event: PointerEvent): void {
		if (event.button !== 0) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		lastPointerX = event.clientX;
		onresizestart?.();
	}

	function drag(event: PointerEvent): void {
		if (lastPointerX === undefined) return;
		onmove(event.clientX - lastPointerX);
		lastPointerX = event.clientX;
	}

	function stopDragging(): void {
		if (lastPointerX === undefined) return;
		lastPointerX = undefined;
		onresizeend?.();
	}

	function resizeWithKeyboard(event: KeyboardEvent): void {
		const step = event.shiftKey ? largeKeyboardStepInPixels : keyboardStepInPixels;
		if (event.key === 'ArrowLeft') onmove(-step);
		else if (event.key === 'ArrowRight') onmove(step);
		else if (event.key === 'Home') onmove(-Number.MAX_SAFE_INTEGER);
		else if (event.key === 'End') onmove(Number.MAX_SAFE_INTEGER);
		else return;
		event.preventDefault();
	}
</script>

<!-- Un séparateur réglable (WAI-ARIA « window splitter ») : focalisable, il est interactif, ce que Svelte ignore. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	role="separator"
	aria-orientation="vertical"
	aria-label={label}
	aria-valuenow={Math.round(value)}
	aria-valuemin={minimum}
	aria-valuemax={maximum}
	tabindex="0"
	title={label}
	data-dragging={lastPointerX !== undefined ? 'true' : undefined}
	class="group relative flex w-3 flex-none cursor-col-resize touch-none items-center justify-center select-none focus-visible:outline-2 focus-visible:outline-focus-ring"
	onpointerdown={startDragging}
	onpointermove={drag}
	onpointerup={stopDragging}
	onpointercancel={stopDragging}
	onlostpointercapture={stopDragging}
	onkeydown={resizeWithKeyboard}
	ondblclick={onreset}
>
	<span
		class="grid h-10 w-2.5 place-items-center rounded-full border border-line bg-surface text-ink-subtle shadow-card transition-colors duration-[120ms] group-hover:border-accent group-hover:text-accent-text group-data-[dragging=true]:border-accent group-data-[dragging=true]:bg-accent group-data-[dragging=true]:text-on-accent"
	>
		<Icon name="dots-six-vertical" size={12} />
	</span>
</div>
