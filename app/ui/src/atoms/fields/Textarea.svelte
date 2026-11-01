<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { value = $bindable(), class: className = '', ...textareaAttributes }: HTMLTextareaAttributes = $props();
</script>

<textarea
	bind:value
	{...textareaAttributes}
	class="min-h-24 w-full rounded-control border border-line-strong/55 bg-field px-3 py-2 text-[15.5px] leading-6 text-ink transition-[border-color,box-shadow] duration-[120ms] placeholder:text-ink-subtle focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft-value)] focus-visible:outline-none aria-invalid:border-danger {className}"
></textarea>
