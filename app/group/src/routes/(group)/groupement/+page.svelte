<script lang="ts">
	import { Alert, PageHeader } from '@crystal-pharm/ui';
	import GroupProfileForm from '$lib/components/organisms/GroupProfileForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const profileFailure = $derived(form && 'fieldErrors' in form ? form : undefined);
</script>

<svelte:head>
	<title>Mon groupement · Crystal Pharm</title>
</svelte:head>

<div class="grid w-full max-w-3xl gap-3.5">
	<PageHeader
		icon="buildings"
		title="Mon groupement"
		context="Le nom, le logo et la carte de fidélité de votre groupement, pour le site de vos pharmacies."
	/>

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
