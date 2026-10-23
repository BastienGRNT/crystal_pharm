<script lang="ts">
	import { page } from '$app/state';
	import { PageHeader } from '@crystal-pharm/ui';
	import GroupForm from '$lib/components/organisms/GroupForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Modifier {data.groupName} · Crystal Pharm</title>
</svelte:head>

<PageHeader
	icon="pencil-simple"
	title="Modifier {data.groupName}"
	context="Les changements de contrat s’appliquent tout de suite aux pharmacies membres."
/>

<GroupForm
	initialValues={form?.values ?? data.values}
	catalog={data.catalog}
	fieldErrors={form?.fieldErrors}
	isCreation={false}
	submitLabel="Enregistrer"
	cancelHref="/groupements/{page.params.groupId}"
/>
