<script lang="ts">
	type AbsenceBlockProps = {
		label: string;
		detail: string;
		/** `table-cell` : une case de la grille de la semaine ; `timeline` : une barre de la frise. */
		placement: 'table-cell' | 'timeline';
		/** Les bordures de la grille, posées par l'organisme qui l'affiche. */
		tableCellClasses?: string;
	};

	let { label, detail, placement, tableCellClasses = '' }: AbsenceBlockProps = $props();
</script>

{#if placement === 'table-cell'}
	<td class="{tableCellClasses} bg-absence px-2 py-1.5 align-top text-[12.5px] text-on-absence">
		<b class="block">{label}</b>
		{detail}
	</td>
{:else}
	<div class="absolute inset-y-1.5 right-0 left-0 z-10 rounded-xs bg-absence px-2 py-1 text-[12.5px] text-on-absence">
		<b>{label}</b> · {detail}
	</div>
{/if}
