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
	class="h-control w-full appearance-none rounded-sm border border-line-strong bg-surface bg-no-repeat pr-8 pl-2.5 text-[14px] leading-5 text-ink transition-[border-color,box-shadow] duration-[120ms] [background-image:linear-gradient(45deg,transparent_50%,currentColor_50%),linear-gradient(135deg,currentColor_50%,transparent_50%)] [background-position:calc(100%-16px)_50%,calc(100%-12px)_50%] [background-size:4px_4px] focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)] focus-visible:outline-none aria-invalid:border-danger {className}"
>
	{@render children?.()}
</select>
