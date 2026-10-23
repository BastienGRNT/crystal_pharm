<script lang="ts">
	import { Alert, Button, Card, ConfirmButton, EmptyState, FilterTabs, PageHeader, SidePanel } from '@crystal-pharm/ui';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import { employeePanelPathname, homePathnames } from '../../homePathnames';
	import EmployeeForm from '../../components/organisms/EmployeeForm.svelte';
	import EmployeeList from '../../components/organisms/EmployeeList.svelte';
	import OpeningHoursForm from '../../components/organisms/OpeningHoursForm.svelte';
	import PharmacyContactDetailsForm from '../../components/organisms/PharmacyContactDetailsForm.svelte';
	import { emptyEmployeeIdentity, type PharmacyPageData, type PharmacyPageFormResult, type PharmacySection } from './pharmacyPageData';
	import { toPharmacySectionTabs } from './pharmacySectionTabs';

	type PharmacyPageProps = {
		data: PharmacyPageData;
		form: PharmacyPageFormResult | null | undefined;
	};

	let { data, form }: PharmacyPageProps = $props();

	const savedMessages: Record<PharmacySection, string> = {
		contactDetails: 'Vos coordonnées sont enregistrées.',
		openingHours: 'Vos horaires d’ouverture sont enregistrés.',
		team: 'Votre équipe est à jour.',
		group: 'Vous avez quitté le groupement.'
	};
	const contactDetailsFailure = $derived(form && 'failedSection' in form && form.failedSection === 'contactDetails' ? form : undefined);
	const openingHoursFailure = $derived(form && 'failedSection' in form && form.failedSection === 'openingHours' ? form : undefined);
	const employeeFailure = $derived(form && 'failedSection' in form && form.failedSection === 'team' ? form : undefined);
	const savedSection = $derived(form && 'savedSection' in form ? form.savedSection : undefined);
	// Après un envoi, l'URL de l'action a perdu `?onglet=` : on rouvre l'onglet du formulaire envoyé.
	const selectedSection = $derived(
		savedSection ??
			contactDetailsFailure?.failedSection ??
			openingHoursFailure?.failedSection ??
			employeeFailure?.failedSection ??
			data.selectedSection
	);
	// Un envoi refusé garde son panneau ouvert ; un envoi réussi le ferme.
	const employeePanel = $derived(
		employeeFailure ? { employeeId: employeeFailure.employeeId } : savedSection ? undefined : data.employeePanel
	);
	const editedTeamMember = $derived(data.team.find((teamMember) => teamMember.employeeId === employeePanel?.employeeId));
</script>

<svelte:head>
	<title>Ma pharmacie · Crystal Pharm</title>
</svelte:head>

<div class="mx-auto grid w-full max-w-5xl gap-3.5">
	<PageHeader icon="storefront" title="Ma pharmacie" context="Les informations de votre officine, affichées sur son site." />

	{#if data.weeklyOpeningSchedule === undefined && selectedSection !== 'openingHours'}
		<Alert tone="warning" title="Horaires d’ouverture à compléter">
			Renseignez-les dans l’onglet <a href={homePathnames.pharmacyOpeningHours} class="font-semibold underline">Horaires</a> :
			ils s’afficheront sur votre site.
		</Alert>
	{/if}

	<FilterTabs label="Informations de la pharmacie" tabs={toPharmacySectionTabs(selectedSection, data.group !== undefined)} />

	{#if selectedSection === 'contactDetails'}
		<section aria-labelledby="coordonnees-titre" class="max-w-3xl">
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
	{:else if selectedSection === 'openingHours'}
		<section aria-label="Horaires d’ouverture" class="grid gap-3.5">
			{#if savedSection === 'openingHours'}
				<Alert tone="success">{savedMessages.openingHours}</Alert>
			{/if}
			<OpeningHoursForm
				formAction="?/openingHours"
				initialWeeklyOpeningSchedule={data.weeklyOpeningSchedule}
				failureMessage={openingHoursFailure?.failureMessage}
				submitLabel="Enregistrer les horaires"
				heading="Vos horaires de la semaine"
				showsVisitorPreview
			/>
		</section>
	{:else if selectedSection === 'team'}
		<section aria-labelledby="equipe-titre" class="max-w-3xl">
			<Card>
				<div class="grid gap-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 id="equipe-titre" class="title-2 text-ink">Équipe</h2>
						{#if data.team.length > 0}
							<Button href={employeePanelPathname(undefined)} variant="secondary" icon="user-plus">Ajouter un membre</Button>
						{/if}
					</div>
					{#if savedSection === 'team'}
						<Alert tone="success">{savedMessages.team}</Alert>
					{/if}
					{#if data.team.length > 0}
						<EmployeeList team={data.team} removeAction="?/removeEmployee" />
					{:else}
						<EmptyState
							icon="users-three"
							title="Présentez votre équipe"
							description="Le nom, le poste et, si vous le souhaitez, la photo de chacun s’afficheront sur votre site."
						>
							{#snippet actions()}
								<Button href={employeePanelPathname(undefined)} icon="user-plus">Ajouter un membre</Button>
							{/snippet}
						</EmptyState>
					{/if}
				</div>
			</Card>
		</section>
	{:else}
		<section aria-labelledby="groupement-titre" data-module="grp" class="max-w-3xl">
			<Card>
				<div class="grid gap-4">
					<h2 id="groupement-titre" class="title-2 text-ink">Groupement</h2>
					{#if savedSection === 'group'}
						<Alert tone="success">{savedMessages.group}</Alert>
					{/if}
					{#if data.group?.coverageEndsAt}
						<Alert tone="warning" title="Vous avez quitté {data.group.groupName}">
							Sa prise en charge court jusqu’au {formatLastDayBefore(data.group.coverageEndsAt)}. Ensuite, vos modules passent au prix
							normal.
						</Alert>
					{:else if data.group}
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
	{/if}
</div>

{#if selectedSection === 'team' && employeePanel}
	<SidePanel title={editedTeamMember ? `Modifier ${editedTeamMember.fullName}` : 'Ajouter un membre'} closeHref={homePathnames.pharmacyTeam}>
		<EmployeeForm
			formAction={editedTeamMember ? '?/updateEmployee' : '?/addEmployee'}
			employeeId={editedTeamMember?.employeeId}
			initialIdentity={employeeFailure?.submittedIdentity ?? editedTeamMember?.identity ?? emptyEmployeeIdentity}
			photoUrl={editedTeamMember?.photoUrl}
			fieldErrors={employeeFailure?.fieldErrors}
			submitLabel={editedTeamMember ? 'Enregistrer' : 'Ajouter à l’équipe'}
			cancelHref={homePathnames.pharmacyTeam}
		/>
	</SidePanel>
{/if}
