<script lang="ts">
	import design from './design';
	import BrandRow from './organisms/BrandRow.svelte';
	import HoursTable from './organisms/HoursTable.svelte';
	import PharmacyHeader from './organisms/PharmacyHeader.svelte';
	import ReviewGrid from './organisms/ReviewGrid.svelte';
	import ServiceGrid from './organisms/ServiceGrid.svelte';
	import TeamGrid from './organisms/TeamGrid.svelte';

	// `Host` porte la gamme déclarée dans design.ts : c'est lui qui exige
	// ci-dessous les sections promises. En oublier une ne compile pas.
	const { Host } = design;
</script>

<Host>
	{#snippet pharmacyInfo(pharmacy)}<PharmacyHeader {pharmacy} />{/snippet}
	{#snippet openingHours(hours)}<HoursTable {hours} />{/snippet}
	{#snippet services(list)}<ServiceGrid {list} />{/snippet}
	{#snippet brands(list)}<BrandRow {list} />{/snippet}
	{#snippet team(staff)}<TeamGrid {staff} />{/snippet}
	{#snippet testimonials(reviews)}<ReviewGrid {reviews} />{/snippet}
</Host>
