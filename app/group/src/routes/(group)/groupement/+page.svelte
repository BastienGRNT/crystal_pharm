<script lang="ts">
	import { Alert, PageHeader } from '@crystal-pharm/ui';
	import GroupSectionTabs from '$lib/components/molecules/GroupSectionTabs.svelte';
	import GroupProfileForm from '$lib/components/organisms/GroupProfileForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const profileFailure = $derived(form && 'fieldErrors' in form ? form : undefined);
</script>

<svelte:head>
	<title>Mon groupement · Crystal Pharm</title>
</svelte:head>

<div class="grid gap-6">
	<PageHeader icon="buildings" title="Mon groupement" context="Ce que vos pharmacies affichent de vous sur leur site.">
		{#snippet navigation()}<GroupSectionTabs isContractAwaitingPayment={data.isContractAwaitingPayment} />{/snippet}
	</PageHeader>

	{#if form && 'isSaved' in form}
		<Alert tone="success">La fiche de votre groupement est enregistrée.</Alert>
	{/if}

	<!-- Après un envoi, le formulaire repart de ce qui vient d'être enregistré ou refusé. -->
	{#key form}
		<GroupProfileForm
			initialProfile={profileFailure?.submittedProfile ?? data.profile}
			imageUrls={data.imageUrls}
			fieldErrors={profileFailure?.fieldErrors}
		/>
	{/key}
</div>
