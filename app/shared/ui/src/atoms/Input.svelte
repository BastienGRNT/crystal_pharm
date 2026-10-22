<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { value = $bindable(), class: className = '', ...inputAttributes }: HTMLInputAttributes =
		$props();
</script>

<input
	bind:value
	{...inputAttributes}
	class="h-control w-full rounded-sm border border-line-strong bg-surface px-2.5 text-[14px] leading-5 text-ink tabular-nums transition-[border-color,box-shadow] duration-[120ms] placeholder:text-ink-subtle focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)] focus-visible:outline-none aria-invalid:border-danger {className}"
/>
