<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type TextInputProps = Omit<HTMLInputAttributes, 'class' | 'value' | 'size'> & {
		value?: string;
		height?: 'md' | 'lg';
	};

	let { value = $bindable(''), height = 'md', ...inputAttributes }: TextInputProps = $props();

	const heightClasses = {
		md: 'h-control-md',
		lg: 'h-control-lg'
	};
</script>

<input
	bind:value
	{...inputAttributes}
	class={[
		'w-full rounded-md border border-line-strong bg-surface px-2.5 text-body text-ink tabular-nums shadow-xs',
		'transition-[border-color,box-shadow] duration-120 placeholder:text-ink-subtle',
		'focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent-soft focus-visible:outline-none',
		'aria-invalid:border-danger',
		heightClasses[height]
	]}
/>
