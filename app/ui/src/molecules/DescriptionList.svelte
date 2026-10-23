<script lang="ts">
	import type { DescriptionItem } from './descriptionList';

	let { items }: { items: DescriptionItem[] } = $props();
</script>

<dl class="grid gap-3.5">
	{#each items as item (item.label)}
		<div class="grid gap-0.5">
			<dt class="text-[12px] leading-4 font-medium text-ink-muted">{item.label}</dt>
			<dd class="text-[14px] leading-5 text-ink tabular-nums">
				{item.value}
				{#if item.detail}
					<span class="block text-[13px] leading-[18px] text-ink-subtle">{item.detail}</span>
				{/if}
			</dd>
		</div>
	{/each}
</dl>
