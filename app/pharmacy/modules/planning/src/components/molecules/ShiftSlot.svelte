<script lang="ts">
	import { Icon } from '@crystal-pharm/ui';
	import ShiftChip from '../atoms/ShiftChip.svelte';
	import type { ShiftChipTone } from '../atoms/shiftChip';

	type ShiftSlotProps = {
		slotId: string;
		label: string;
		tone: ShiftChipTone;
		/** Action du formulaire de suppression ; reçoit le champ `slotId`. Sans elle, pas de bouton. */
		deleteSlotFormAction?: string;
	};

	let { slotId, label, tone, deleteSlotFormAction }: ShiftSlotProps = $props();
</script>

<ShiftChip {label} {tone}>
	{#if deleteSlotFormAction}
		<form method="POST" action={deleteSlotFormAction} class="contents">
			<input type="hidden" name="slotId" value={slotId} />
			<button
				type="submit"
				aria-label="Supprimer le créneau {label}"
				class="absolute top-1/2 right-[3px] grid size-[22px] -translate-y-1/2 cursor-pointer place-items-center rounded-xs bg-surface text-ink-muted opacity-0 shadow-[0_0_0_1px_var(--line)] transition-opacity duration-[120ms] group-hover:opacity-100 hover:text-danger focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
			>
				<Icon name="x" size={12} />
			</button>
		</form>
	{/if}
</ShiftChip>
