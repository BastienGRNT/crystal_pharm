<script lang="ts">
	import { CapacityGrid } from '@crystal-pharm/ui';

	type PharmacyPlacesProps = {
		memberCount: number;
		invitedCount: number;
		quota: number;
		surface?: 'rail' | 'page';
	};

	let { memberCount, invitedCount, quota, surface = 'page' }: PharmacyPlacesProps = $props();

	const summary = $derived(
		`${memberCount} membre${memberCount > 1 ? 's' : ''}, ${invitedCount} invitée${invitedCount > 1 ? 's' : ''}, ${quota} places en tout`
	);
</script>

<CapacityGrid filledCount={memberCount} pendingCount={invitedCount} capacity={quota} {summary} {surface} />
