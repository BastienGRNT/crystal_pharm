<script lang="ts">
	import { Alert, Button, ConfirmButton, EmptyState, FormSection, Icon, PageHeader, PageTabs, SidePanel } from '@crystal-pharm/ui';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import { accessPanelPathname, employeePanelPathname, homePathnames } from '../../homePathnames';
	import AccessInvitationList from '../../components/organisms/access/AccessInvitationList.svelte';
	import AccessMemberList from '../../components/organisms/access/AccessMemberList.svelte';
	import CounterAccountForm from '../../components/organisms/access/CounterAccountForm.svelte';
	import MemberAccessForm from '../../components/organisms/access/MemberAccessForm.svelte';
	import TeamInvitationForm from '../../components/organisms/access/TeamInvitationForm.svelte';
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
		group: 'Vous avez quitté le groupement.',
		access: 'Les accès sont à jour.'
	};
	const contactDetailsFailure = $derived(form && 'failedSection' in form && form.failedSection === 'contactDetails' ? form : undefined);
	const openingHoursFailure = $derived(form && 'failedSection' in form && form.failedSection === 'openingHours' ? form : undefined);
	const employeeFailure = $derived(form && 'failedSection' in form && form.failedSection === 'team' ? form : undefined);
	const accessFailure = $derived(form && 'failedSection' in form && form.failedSection === 'access' ? form : undefined);
	const savedSection = $derived(form && 'savedSection' in form ? form.savedSection : undefined);
	const savedMessage = $derived(form && 'savedSection' in form ? (form.savedMessage ?? savedMessages[form.savedSection]) : undefined);
	// Après un envoi, l'URL de l'action a perdu `?onglet=` : on rouvre l'onglet du formulaire envoyé.
	const selectedSection = $derived(
		savedSection ??
			contactDetailsFailure?.failedSection ??
			openingHoursFailure?.failedSection ??
			employeeFailure?.failedSection ??
			accessFailure?.failedSection ??
			data.selectedSection
	);
	// Un envoi refusé garde son panneau ouvert ; un envoi réussi le ferme.
	const employeePanel = $derived(
		employeeFailure ? { employeeId: employeeFailure.employeeId } : savedSection ? undefined : data.employeePanel
	);
	const editedTeamMember = $derived(data.team.find((teamMember) => teamMember.employeeId === employeePanel?.employeeId));
	const accessPanel = $derived(accessFailure ? accessFailure.accessPanel : savedSection ? undefined : data.accessPanel);
	const editedAccessMember = $derived(
		accessPanel?.kind === 'member' ? data.access?.members.find((member) => member.accountId === accessPanel.accountId) : undefined
	);
	const optionalSections = $derived({ hasGroup: data.group !== undefined, canManageAccess: data.access !== undefined });
</script>

<svelte:head>
	<title>Ma pharmacie · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="storefront" title="Ma pharmacie" context="Les informations de votre officine, affichées sur son site.">
	{#snippet actions()}
		{#if selectedSection === 'team'}
			<Button href={employeePanelPathname(undefined)} icon="user-plus">Ajouter un membre</Button>
		{:else if selectedSection === 'access' && data.access}
			{#if !data.access.hasCounterAccount}
				<Button href={accessPanelPathname({ kind: 'counter-account' })} variant="secondary" icon="storefront">
					Créer le compte comptoir
				</Button>
			{/if}
			<Button href={accessPanelPathname({ kind: 'invitation' })} icon="envelope-simple">Inviter un membre</Button>
		{/if}
	{/snippet}
	{#snippet navigation()}
		<PageTabs label="Informations de la pharmacie" tabs={toPharmacySectionTabs(selectedSection, optionalSections)} />
	{/snippet}
</PageHeader>

<div class="grid gap-6">
	{#if data.weeklyOpeningSchedule === undefined && selectedSection !== 'openingHours'}
		<Alert tone="warning" title="Horaires d’ouverture à compléter">
			Renseignez-les dans l’onglet <a href={homePathnames.pharmacyOpeningHours} class="font-semibold underline">Horaires</a> :
			ils s’afficheront sur votre site.
		</Alert>
	{/if}

	{#if selectedSection === 'contactDetails'}
		<FormSection title="Coordonnées" description="Le nom, l’adresse et le téléphone que vos patients voient sur votre site.">
			{#if savedSection === 'contactDetails'}
				<Alert tone="success">{savedMessages.contactDetails}</Alert>
			{/if}
			<PharmacyContactDetailsForm
				formAction="?/contactDetails"
				initialContactDetails={contactDetailsFailure?.submittedContactDetails ?? data.contactDetails}
				fieldErrors={contactDetailsFailure?.fieldErrors}
				submitLabel="Enregistrer les coordonnées"
			/>
		</FormSection>
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
		<section aria-labelledby="equipe-titre" class="grid gap-4">
			<div class="grid gap-0.5">
				<h2 id="equipe-titre" class="font-display text-[22px] leading-7 text-ink">L’équipe sur votre site</h2>
				<p class="text-small text-ink-muted">Le nom, le poste et la photo de chacun, tels que vos patients les voient.</p>
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
				/>
			{/if}
		</section>
	{:else if selectedSection === 'access' && data.access}
		{#if savedSection === 'access'}
			<Alert tone="success">{savedMessage}</Alert>
		{/if}
		{#if accessFailure && !accessPanel}
			<Alert tone="danger">{accessFailure.failureMessage}</Alert>
		{/if}
		<FormSection
			title="Les comptes"
			description="Les titulaires ont tous les droits. Les autres comptes n’ouvrent que les responsabilités que vous leur donnez."
		>
			<AccessMemberList members={data.access.members} />
		</FormSection>
		{#if data.access.pendingInvitations.length > 0}
			<FormSection title="Invitations en attente" description="Le lien reçu par email est valable quelques jours.">
				<AccessInvitationList invitations={data.access.pendingInvitations} revokeAction="?/revokeInvitation" />
			</FormSection>
		{/if}
	{:else}
		<div data-module="grp">
			<FormSection title="Groupement" description="Il voit le nom et la ville de votre pharmacie, et les outils que vous utilisez.">
				{#if savedSection === 'group'}
					<Alert tone="success">{savedMessages.group}</Alert>
				{/if}
				{#if data.group?.coverageEndsAt}
					<Alert tone="warning" title="Vous avez quitté {data.group.groupName}">
						Sa prise en charge court jusqu’au {formatLastDayBefore(data.group.coverageEndsAt)}. Ensuite, votre formule passe au prix
						normal.
					</Alert>
				{:else if data.group}
					<div class="grid gap-1">
						<p class="font-display text-[24px] leading-8 text-ink">{data.group.groupName}</p>
						{#if data.group.joinedAt}<p class="text-small text-ink-muted">Membre depuis le {formatDay(data.group.joinedAt)}</p>{/if}
					</div>
					{#if data.group.coverageLines.length > 0}
						<ul class="grid gap-1.5 border-t border-dashed border-line-strong/50 pt-3 text-body text-ink">
							{#each data.group.coverageLines as coverageLine (coverageLine)}
								<li class="flex items-start gap-2"><Icon name="check" size={18} class="mt-0.5 flex-none text-accent-text" />{coverageLine}</li>
							{/each}
						</ul>
					{/if}
					{#if data.canLeaveGroup}
						<form method="POST" action="?/leaveGroup" class="border-t border-dashed border-line-strong/50 pt-3">
							<ConfirmButton
								label="Quitter le groupement"
								icon="sign-out"
								variant="ghost"
								title="Quitter {data.group.groupName} ?"
								description="Le groupement ne verra plus votre pharmacie. Sa prise en charge court jusqu’à la fin du mois ; ensuite, votre formule passe au prix normal."
								confirmLabel="Quitter le groupement"
								isDestructive
							/>
						</form>
					{/if}
				{/if}
			</FormSection>
		</div>
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

{#if selectedSection === 'access' && data.access && accessPanel}
	{#if accessPanel.kind === 'invitation'}
		<SidePanel title="Inviter un membre de l’équipe" closeHref={homePathnames.pharmacyAccess}>
			<TeamInvitationForm
				formAction="?/inviteEmployee"
				invitableEmployees={data.access.invitableEmployees}
				failure={accessFailure}
				cancelHref={homePathnames.pharmacyAccess}
				teamHref={homePathnames.pharmacyTeam}
			/>
		</SidePanel>
	{:else if accessPanel.kind === 'counter-account'}
		<SidePanel title="Créer le compte comptoir" closeHref={homePathnames.pharmacyAccess}>
			<CounterAccountForm formAction="?/createCounterAccount" failure={accessFailure} cancelHref={homePathnames.pharmacyAccess} />
		</SidePanel>
	{:else if editedAccessMember}
		<SidePanel title={editedAccessMember.name} closeHref={homePathnames.pharmacyAccess}>
			<MemberAccessForm member={editedAccessMember} failure={accessFailure} cancelHref={homePathnames.pharmacyAccess} />
		</SidePanel>
	{/if}
{/if}
