<script lang="ts">
	import { Alert, Card, ConfirmButton, PageHeader } from '@crystal-pharm/ui';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import OpeningHoursForm from '../../components/organisms/OpeningHoursForm.svelte';
	import PharmacyContactDetailsForm from '../../components/organisms/PharmacyContactDetailsForm.svelte';
	import type { PharmacyPageData, PharmacyPageFormResult, PharmacySection } from './pharmacyPageData';

	type PharmacyPageProps = {
		data: PharmacyPageData;
		form: PharmacyPageFormResult | null | undefined;
	};

	let { data, form }: PharmacyPageProps = $props();

	const savedMessages: Record<PharmacySection, string> = {
		contactDetails: 'Vos coordonnées sont enregistrées.',
		openingHours: 'Vos horaires d’ouverture sont enregistrés.',
		group: 'Vous avez quitté le groupement.'
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

	<section id="groupement" aria-labelledby="groupement-titre" class="scroll-mt-20" data-module="grp">
		<Card>
			<div class="grid gap-4">
				<h2 id="groupement-titre" class="title-2 text-ink">Groupement</h2>
				{#if savedSection === 'group'}
					<Alert tone="success">{savedMessages.group}</Alert>
				{/if}
				{#if !data.group}
					<p class="text-body text-ink-muted">
						Votre pharmacie n’appartient à aucun groupement. Si le vôtre est sur Crystal Pharm, il vous invite par email : l’invitation
						apparaîtra sur l’accueil.
					</p>
				{:else if data.group.coverageEndsAt}
					<Alert tone="warning" title="Vous avez quitté {data.group.groupName}">
						Sa prise en charge court jusqu’au {formatLastDayBefore(data.group.coverageEndsAt)}. Ensuite, vos modules passent au prix normal.
					</Alert>
				{:else}
					<div class="grid gap-1">
						<p class="text-body">
							<span class="body-strong">{data.group.groupName}</span>
							{#if data.group.joinedAt}<span class="text-ink-muted"> · membre depuis le {formatDay(data.group.joinedAt)}</span>{/if}
						</p>
						{#if data.group.coverageLines.length > 0}
							<ul class="text-small text-ink-muted">
								{#each data.group.coverageLines as coverageLine (coverageLine)}<li>{coverageLine}</li>{/each}
							</ul>
						{/if}
						<p class="text-small text-ink-muted">Il voit le nom et la ville de votre pharmacie, et les modules que vous utilisez.</p>
					</div>
					<form method="POST" action="?/leaveGroup">
						<ConfirmButton
							label="Quitter le groupement"
							icon="sign-out"
							title="Quitter {data.group.groupName} ?"
							description="Le groupement ne verra plus votre pharmacie. Sa prise en charge court jusqu’à la fin du mois ; ensuite, vos modules passent au prix normal."
							confirmLabel="Quitter le groupement"
							isDestructive
						/>
					</form>
				{/if}
			</div>
		</Card>
	</section>
</div>
