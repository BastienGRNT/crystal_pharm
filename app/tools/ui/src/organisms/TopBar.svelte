<script lang="ts">
	let { sectionLabel }: { sectionLabel: string } = $props();
</script>

<div
	class="sticky top-0 z-2 flex h-topbar flex-none items-center justify-between border-b border-line bg-surface px-7 text-[13px] text-ink-muted shadow-[inset_0_3px_0_var(--accent-value)]"
>
	<p><b class="font-semibold text-ink">{sectionLabel}</b></p>
</div>
