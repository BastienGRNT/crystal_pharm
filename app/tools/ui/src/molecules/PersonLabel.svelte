<script lang="ts">
	import Avatar from '../atoms/Avatar.svelte';

	type PersonLabelProps = {
		name: string;
		initials: string;
		detail?: string;
	};

	let { name, initials, detail }: PersonLabelProps = $props();
</script>

<span class="flex min-w-0 items-center gap-3">
	<Avatar {initials} />
	<span class="min-w-0">
		<b class="block font-semibold whitespace-nowrap text-ink">{name}</b>
		{#if detail}
			<small class="block text-[13px] leading-[18px] text-ink-subtle tabular-nums">{detail}</small>
		{/if}
	</span>
</span>
