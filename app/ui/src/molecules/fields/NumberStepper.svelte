<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from '../../atoms/icons/Icon.svelte';

	type NumberStepperProps = Omit<HTMLInputAttributes, 'value' | 'min' | 'max' | 'type'> & {
		value: number | string;
		min: number;
		max: number;
		/** Ce que compte le nombre, lu par un lecteur d'écran sur les boutons (« pharmacien »). */
		unitLabel: string;
	};

	let { value = $bindable(), min, max, unitLabel, ...inputAttributes }: NumberStepperProps = $props();

	const currentNumber = $derived(Number(value) || 0);

	function changeBy(step: number): void {
		value = String(Math.min(max, Math.max(min, currentNumber + step)));
	}
</script>

<!-- Un petit nombre se règle au doigt, sans viser le minuscule curseur du champ numérique. -->
<div
	class="inline-flex h-control-touch w-fit items-center justify-self-start sm:h-control rounded-control border border-line-strong/55 bg-field transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] has-[[aria-invalid=true]]:border-danger"
>
	<button
		type="button"
		class="grid h-full w-control-touch flex-none sm:w-control cursor-pointer place-items-center rounded-l-sm text-ink-muted hover:bg-surface-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
		aria-label="Un {unitLabel} de moins"
		disabled={currentNumber <= min}
		onclick={() => changeBy(-1)}
	>
		<Icon name="minus" size={16} />
	</button>
	<input
		bind:value
		{...inputAttributes}
		type="number"
		inputmode="numeric"
		{min}
		{max}
		class="h-full w-12 border-x border-line-soft bg-transparent text-center text-[16px] leading-5 font-semibold text-ink tabular-nums [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<button
		type="button"
		class="grid h-full w-control-touch flex-none sm:w-control cursor-pointer place-items-center rounded-r-sm text-ink-muted hover:bg-surface-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
		aria-label="Un {unitLabel} de plus"
		disabled={currentNumber >= max}
		onclick={() => changeBy(1)}
	>
		<Icon name="plus" size={16} />
	</button>
</div>
