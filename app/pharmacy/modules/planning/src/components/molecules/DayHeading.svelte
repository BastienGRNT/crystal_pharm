<script lang="ts">
	type DayHeadingProps = {
		dayName: string;
		dayNumber: number;
		isToday: boolean;
		/** Une ligne sous le jour (« 4 pers. »). */
		detail?: string;
		/** Fait du jour un lien, vers la vue de cette journée. */
		href?: string;
	};

	let { dayName, dayNumber, isToday, detail, href }: DayHeadingProps = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	title={href ? 'Voir la journée' : undefined}
	class="-mx-1 block rounded-xs px-1 no-underline {href ? 'hover:bg-surface-muted' : ''}"
>
	{dayName}
	<span
		class="ml-0.5 inline-grid h-[22px] min-w-[22px] place-items-center rounded-full text-[13px] {isToday
			? 'bg-accent text-on-accent'
			: 'text-ink'}"
	>
		{dayNumber}
	</span>
	{#if detail}
		<span class="block font-normal text-ink-subtle">{detail}</span>
	{/if}
</svelte:element>
