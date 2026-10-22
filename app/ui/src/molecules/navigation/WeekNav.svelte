<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';

	type WeekNavProps = {
		weekLabel: string;
		previousWeekHref: string;
		nextWeekHref: string;
		/** Pour naviguer par jour plutôt que par semaine : les libellés lus par les lecteurs d'écran. */
		navigationLabel?: string;
		previousLabel?: string;
		nextLabel?: string;
	};

	let {
		weekLabel,
		previousWeekHref,
		nextWeekHref,
		navigationLabel = 'Semaine affichée',
		previousLabel = 'Semaine précédente',
		nextLabel = 'Semaine suivante'
	}: WeekNavProps = $props();

	const arrowClasses =
		'grid h-full w-[34px] place-items-center text-ink-muted hover:bg-surface-subtle hover:text-ink';
</script>

<nav
	aria-label={navigationLabel}
	class="inline-flex h-control items-center rounded-sm border border-line-strong bg-surface"
>
	<a href={previousWeekHref} aria-label={previousLabel} class="{arrowClasses} rounded-l-sm">
		<Icon name="caret-left" size={16} />
	</a>
	<span
		class="border-x border-line px-3 text-[13.5px] leading-[34px] font-semibold whitespace-nowrap tabular-nums"
	>
		{weekLabel}
	</span>
	<a href={nextWeekHref} aria-label={nextLabel} class="{arrowClasses} rounded-r-sm">
		<Icon name="caret-right" size={16} />
	</a>
</nav>
