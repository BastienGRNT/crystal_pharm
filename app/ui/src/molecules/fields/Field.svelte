<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldControlAttributes } from './field';

	type FieldProps = {
		label: string;
		hint?: string;
		errorMessage?: string;
		control: Snippet<[FieldControlAttributes]>;
	};

	let { label, hint, errorMessage, control }: FieldProps = $props();

	const componentId = $props.id();
	const controlId = `field-${componentId}`;
	const descriptionId = `field-description-${componentId}`;
	const description = $derived(errorMessage ?? hint);
	const controlAttributes: FieldControlAttributes = $derived({
		id: controlId,
		'aria-describedby': description ? descriptionId : undefined,
		'aria-invalid': errorMessage ? true : undefined
	});
</script>

<div class="flex min-w-0 flex-col gap-[5px]">
	<label for={controlId} class="text-[13px] leading-[18px] font-medium text-ink">{label}</label>
	{@render control(controlAttributes)}
	{#if description}
		<p id={descriptionId} class={errorMessage ? 'text-small font-medium text-danger' : 'text-small text-ink-subtle'}>
			{description}
		</p>
	{/if}
</div>
