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
	<span aria-hidden="true" class="h-1.5 rounded-full {isDone || isCurrent ? 'bg-accent' : 'bg-line-strong/40'}"></span>
	<span class="flex min-w-0 items-start gap-1.5">
		<span class="flex-none pt-px text-[12px] leading-4 font-bold tabular-nums {isDone || isCurrent ? 'text-accent-text' : 'text-ink-subtle'}">
			{#if isDone}
				<Icon name="check" size={14} />
				<span class="sr-only">Terminé :</span>
			{:else}
				{stepIndex + 1}
			{/if}
		</span>
		<span class="min-w-0 text-[13px] leading-[18px] {isCurrent ? 'font-bold text-ink' : 'text-ink-muted'}">{step}</span>
	</span>
{/snippet}

<!-- Une jauge par étape : on lit d'un trait ce qui est fait, où l'on est, et ce qui reste. -->
<ol aria-label={label} class="grid auto-cols-fr grid-flow-col gap-2">
	{#each steps as step, stepIndex (step)}
		{@const isDone = stepIndex < currentStepIndex}
		{@const isCurrent = stepIndex === currentStepIndex}
		<li aria-current={isCurrent ? 'step' : undefined} class="min-w-0">
			{#if onStepSelect && !isCurrent}
				<button
					type="button"
					class="grid w-full cursor-pointer gap-2 rounded-xs text-left hover:[&>span:last-child>span:last-child]:text-ink hover:[&>span:last-child>span:last-child]:underline"
					onclick={() => onStepSelect(stepIndex)}
				>
					{@render stepContent(step, stepIndex, isDone, isCurrent)}
				</button>
			{:else}
				<span class="grid gap-2">{@render stepContent(step, stepIndex, isDone, isCurrent)}</span>
			{/if}
		</li>
	{/each}
</ol>
