<script lang="ts">
	let { initials }: { initials: string } = $props();
</script>

<span
	aria-hidden="true"
	class="grid size-avatar flex-none place-items-center rounded-full bg-surface-muted text-[12px] leading-none font-semibold text-ink-muted"
>
	{initials}
</span>
