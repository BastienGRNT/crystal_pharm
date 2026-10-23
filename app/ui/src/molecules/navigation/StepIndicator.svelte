<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';

	type StepIndicatorProps = {
		label: string;
		steps: readonly string[];
		currentStepIndex: number;
	};

	let { label, steps, currentStepIndex }: StepIndicatorProps = $props();
</script>

<ol aria-label={label} class="flex flex-wrap items-center gap-x-3 gap-y-2">
	{#each steps as step, stepIndex (step)}
		{@const isDone = stepIndex < currentStepIndex}
		{@const isCurrent = stepIndex === currentStepIndex}
		<li aria-current={isCurrent ? 'step' : undefined} class="flex items-center gap-2 text-[13px] leading-[18px]">
			{#if stepIndex > 0}
				<span aria-hidden="true" class="h-px w-6 {isDone || isCurrent ? 'bg-accent' : 'bg-line-strong'}"></span>
			{/if}
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
		</li>
	{/each}
</ol>
