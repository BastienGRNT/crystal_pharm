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
	const hintId = `field-hint-${componentId}`;
	const errorId = `field-error-${componentId}`;
	const describedBy = $derived([errorMessage ? errorId : undefined, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined);
	const controlAttributes: FieldControlAttributes = $derived({
		id: controlId,
		'aria-describedby': describedBy,
		'aria-invalid': errorMessage ? true : undefined
	});
</script>

<!-- L'aide reste sous l'erreur : c'est souvent elle qui dit comment corriger. -->
<div class="flex min-w-0 flex-col gap-2">
	<label for={controlId} class="text-label text-ink">{label}</label>
	{@render control(controlAttributes)}
	{#if errorMessage}
		<p id={errorId} class="text-small font-medium text-danger">{errorMessage}</p>
	{/if}
	{#if hint}
		<p id={hintId} class="text-small text-ink-muted">{hint}</p>
	{/if}
</div>
