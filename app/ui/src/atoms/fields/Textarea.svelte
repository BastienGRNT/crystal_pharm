<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { value = $bindable(), class: className = '', ...textareaAttributes }: HTMLTextareaAttributes = $props();
</script>

<textarea
	bind:value
	{...textareaAttributes}
	class="min-h-24 w-full rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-[14px] leading-5 text-ink transition-[border-color,box-shadow] duration-[120ms] placeholder:text-ink-subtle focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)] focus-visible:outline-none aria-invalid:border-danger {className}"
></textarea>
