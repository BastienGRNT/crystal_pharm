<script lang="ts">
	import { Alert, Card, PageHeader } from '@crystal-pharm/ui';
	import OpeningHoursForm from '../components/organisms/OpeningHoursForm.svelte';
	import PharmacyContactDetailsForm from '../components/organisms/PharmacyContactDetailsForm.svelte';
	import type { PharmacyPageData, PharmacyPageFormResult, PharmacySection } from './pharmacyPageData';

	type PharmacyPageProps = {
		data: PharmacyPageData;
		form: PharmacyPageFormResult | null | undefined;
	};

	let { data, form }: PharmacyPageProps = $props();

	const savedMessages: Record<PharmacySection, string> = {
		contactDetails: 'Vos coordonnées sont enregistrées.',
		openingHours: 'Vos horaires d’ouverture sont enregistrés.'
	};
	const contactDetailsFailure = $derived(form && 'failedSection' in form && form.failedSection === 'contactDetails' ? form : undefined);
	const openingHoursFailure = $derived(form && 'failedSection' in form && form.failedSection === 'openingHours' ? form : undefined);
	const savedSection = $derived(form && 'savedSection' in form ? form.savedSection : undefined);
</script>

<svelte:head>
	<title>Ma pharmacie · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="storefront" title="Ma pharmacie" context="Les informations de votre officine, affichées sur son site." />

<div class="grid max-w-[760px] gap-3.5">
	{#if data.weeklyOpeningSchedule === undefined}
		<Alert tone="warning" title="Horaires d’ouverture à compléter">
			Renseignez-les plus bas : ils s’afficheront sur votre site.
		</Alert>
	{/if}

	<section aria-labelledby="coordonnees-titre">
		<Card>
			<div class="grid gap-4">
				<h2 id="coordonnees-titre" class="title-2 text-ink">Coordonnées</h2>
				{#if savedSection === 'contactDetails'}
					<Alert tone="success">{savedMessages.contactDetails}</Alert>
				{/if}
				<PharmacyContactDetailsForm
					formAction="?/contactDetails"
					initialContactDetails={contactDetailsFailure?.submittedContactDetails ?? data.contactDetails}
					fieldErrors={contactDetailsFailure?.fieldErrors}
					submitLabel="Enregistrer les coordonnées"
				/>
			</div>
		</Card>
	</section>

	<section id="horaires" aria-labelledby="horaires-titre" class="scroll-mt-20">
		<Card>
			<div class="grid gap-4">
				<h2 id="horaires-titre" class="title-2 text-ink">Horaires d’ouverture</h2>
				{#if savedSection === 'openingHours'}
					<Alert tone="success">{savedMessages.openingHours}</Alert>
				{/if}
				<OpeningHoursForm
					formAction="?/openingHours"
					initialWeeklyOpeningSchedule={data.weeklyOpeningSchedule}
					failureMessage={openingHoursFailure?.failureMessage}
					submitLabel="Enregistrer les horaires"
				/>
			</div>
		</Card>
	</section>
</div>
