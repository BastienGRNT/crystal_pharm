<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import TextInput from '../atoms/TextInput.svelte';

	type TextFieldProps = Omit<HTMLInputAttributes, 'class' | 'value' | 'size' | 'id'> & {
		label: string;
		value?: string;
		hint?: string;
		errorMessage?: string;
		height?: 'md' | 'lg';
	};

	let { label, value = $bindable(''), hint, errorMessage, height, ...inputAttributes }: TextFieldProps = $props();

	const fieldId = $props.id();
	const inputId = `${fieldId}-input`;
	const descriptionId = `${fieldId}-description`;
	const description = $derived(errorMessage ?? hint);
</script>

<div class="flex min-w-0 flex-col gap-1.5">
	<label for={inputId} class="text-label text-ink">{label}</label>
	<TextInput
		bind:value
		{...inputAttributes}
		{height}
		id={inputId}
		aria-invalid={errorMessage ? true : undefined}
		aria-describedby={description ? descriptionId : undefined}
	/>
	{#if description}
		<p id={descriptionId} class={errorMessage ? 'text-label text-danger' : 'text-small text-ink-subtle'}>
			{description}
		</p>
	{/if}
</div>
