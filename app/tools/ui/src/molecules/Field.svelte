<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { FieldControlAttributes } from './field';

	type FieldProps = {
		label: string;
		control: Snippet<[FieldControlAttributes]>;
	};

	let { label, control }: FieldProps = $props();

	const componentId = $props.id();
	const controlAttributes: FieldControlAttributes = { id: `field-${componentId}` };
</script>

<div class="flex min-w-0 flex-col gap-[5px]">
	<label for={controlAttributes.id} class="text-[13px] leading-[18px] font-medium text-ink">{label}</label>
	{@render control(controlAttributes)}
</div>
