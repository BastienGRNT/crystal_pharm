<script lang="ts">
	import design from './design';
	import BrandStrip from './organisms/BrandStrip.svelte';
	import HoursCard from './organisms/HoursCard.svelte';
	import IdentityCard from './organisms/IdentityCard.svelte';
	import ReviewList from './organisms/ReviewList.svelte';
	import ServiceBoard from './organisms/ServiceBoard.svelte';
	import TeamStrip from './organisms/TeamStrip.svelte';

	const { Host } = design;
</script>

<Host>
	{#snippet pharmacyInfo(pharmacy)}<IdentityCard {pharmacy} />{/snippet}
	{#snippet services(list)}<ServiceBoard {list} />{/snippet}
	{#snippet openingHours(hours)}<HoursCard {hours} />{/snippet}
	{#snippet team(staff)}<TeamStrip {staff} />{/snippet}
	{#snippet brands(list)}<BrandStrip {list} />{/snippet}
	{#snippet testimonials(reviews)}<ReviewList {reviews} />{/snippet}
</Host>
