<script lang="ts">
	import { PageHeader } from '@crystal-pharm/ui';
	import GroupForm from '$lib/components/organisms/GroupForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Nouveau groupement · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="buildings" title="Nouveau groupement" context="Son quota, ce qu’il prend en charge, et son premier responsable." />

<GroupForm
	initialValues={form?.values ?? data.values}
	catalog={data.catalog}
	fieldErrors={form?.fieldErrors}
	isCreation
	submitLabel="Créer le groupement"
	cancelHref="/groupements"
/>
