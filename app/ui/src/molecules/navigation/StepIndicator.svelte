<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';

	type StepIndicatorProps = {
		label: string;
		steps: readonly string[];
		currentStepIndex: number;
		/** Toutes les étapes sont déjà remplies (une modification) : chacune s'ouvre d'un clic. */
		onStepSelect?: (stepIndex: number) => void;
	};

	let { label, steps, currentStepIndex, onStepSelect }: StepIndicatorProps = $props();
</script>

{#snippet stepContent(step: string, stepIndex: number, isDone: boolean, isCurrent: boolean)}
	<span
		class="grid size-6 flex-none place-items-center rounded-full text-label {isDone || isCurrent
			? 'bg-accent text-on-accent'
			: 'border border-line-strong text-ink-muted'}"
	>
		{#if isDone}
			<Icon name="check" size={14} />
			<span class="sr-only">Terminé :</span>
		{:else}
			{stepIndex + 1}
		{/if}
	</span>
	<span class={isCurrent ? 'font-semibold text-ink' : 'text-ink-muted'}>{step}</span>
{/snippet}

<ol aria-label={label} class="flex flex-wrap items-center gap-x-3 gap-y-2">
	{#each steps as step, stepIndex (step)}
		{@const isDone = stepIndex < currentStepIndex}
		{@const isCurrent = stepIndex === currentStepIndex}
		<li aria-current={isCurrent ? 'step' : undefined} class="flex items-center gap-2 text-[13px] leading-[18px]">
			{#if stepIndex > 0}
				<span aria-hidden="true" class="h-px w-6 {isDone || isCurrent ? 'bg-accent' : 'bg-line-strong'}"></span>
			{/if}
			{#if onStepSelect && !isCurrent}
				<button
					type="button"
					class="-m-1 flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-accent-soft [&>span:last-child]:underline [&>span:last-child]:decoration-line-strong [&>span:last-child]:underline-offset-4"
					onclick={() => onStepSelect(stepIndex)}
				>
					{@render stepContent(step, stepIndex, isDone, isCurrent)}
				</button>
			{:else}
				{@render stepContent(step, stepIndex, isDone, isCurrent)}
			{/if}
		</li>
	{/each}
</ol>
