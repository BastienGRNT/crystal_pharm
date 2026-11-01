<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let {
		value = $bindable(),
		class: className = '',
		children,
		...selectAttributes
	}: HTMLSelectAttributes = $props();
</script>

<select
	bind:value
	{...selectAttributes}
	class="h-control w-full appearance-none rounded-control border border-line-strong/55 bg-field bg-no-repeat pr-8 pl-3 text-[15.5px] leading-6 text-ink transition-[border-color,box-shadow] duration-[120ms] [background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%)] [background-position:calc(100%-18px)_50%,calc(100%-14px)_50%] [background-size:4px_4px] focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft-value)] focus-visible:outline-none aria-invalid:border-danger {className}"
>
	{@render children?.()}
</select>
