<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import type { IconName } from '../atoms/icons';

	type EmptyStateProps = {
		icon: IconName;
		title: string;
		text: string;
		action?: Snippet;
	};

	let { icon, title, text, action }: EmptyStateProps = $props();
</script>

<div class="grid justify-items-center gap-1.5 rounded-md border border-dashed border-line px-5 py-10 text-center">
	<span class="mb-1.5 grid size-10 place-items-center rounded-md bg-accent-soft text-accent-text">
		<Icon name={icon} size={20} />
	</span>
	<p class="text-[15px] leading-[22px] font-semibold text-ink">{title}</p>
	<p class="max-w-[44ch] text-[14px] leading-5 text-ink-muted">{text}</p>
	{#if action}
		<div class="mt-2.5">{@render action()}</div>
	{/if}
</div>
