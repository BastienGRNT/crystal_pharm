<script lang="ts">
	import { Button, Card, EmptyState, FilterTabs, PageHeader, type FilterTab } from '@crystal-pharm/ui';
	import { buildTabFormAction, planningSettingsTabParameter, planningSettingsTabs } from '../domain/settings/planningSettingsTabs';
	import PeakWindowsSection from '../components/organisms/settings/PeakWindowsSection.svelte';
	import WeekTemplatesList from '../components/organisms/settings/WeekTemplatesList.svelte';
	import EmployeeTermsList from '../components/organisms/settings/EmployeeTermsList.svelte';
	import PlanningRulesForm from '../components/organisms/settings/PlanningRulesForm.svelte';
	import OvertimeRulesForm from '../components/organisms/settings/OvertimeRulesForm.svelte';
	import AccountantExportSection from '../components/organisms/settings/AccountantExportSection.svelte';
	import type { PlanningSettingsActionResult, PlanningSettingsPageData } from './planningSettingsPageData';

	type PlanningSettingsPageProps = {
		data: PlanningSettingsPageData;
		form: PlanningSettingsActionResult | null | undefined;
	};

	let { data, form }: PlanningSettingsPageProps = $props();

	const rulesFailure = $derived(form && 'failedSection' in form && form.failedSection === 'rules' ? form.message : undefined);
	const rulesSaved = $derived(form !== null && form !== undefined && 'savedSection' in form && form.savedSection === 'rules');
	const overtimeFailure = $derived(form && 'failedSection' in form && form.failedSection === 'overtime' ? form.message : undefined);
	const overtimeSaved = $derived(form !== null && form !== undefined && 'savedSection' in form && form.savedSection === 'overtime');
	const accountantFeedback = $derived.by(() => {
		if (form && 'failedSection' in form && form.failedSection === 'accountant') return { message: form.message, isFailure: true };
		if (form && 'savedSection' in form && form.savedSection === 'accountant' && form.message) return { message: form.message, isFailure: false };
		return undefined;
	});
	const peaksFailure = $derived(form && 'failedSection' in form && form.failedSection === 'peaks' ? form.message : undefined);
	// Un onglet = un enregistrement : on ne perd plus une saisie en enregistrant le formulaire d'à côté.
	const tabs: FilterTab[] = $derived(
		planningSettingsTabs.map((tab) => ({
			label: tab.label,
			href: `?${planningSettingsTabParameter}=${tab.key}`,
			isCurrent: tab.key === data.selectedTab,
			count: tab.key === 'contrats' ? data.employees.length : undefined
		}))
	);
	const termsFeedback = $derived.by(() => {
		if (!form) return undefined;
		if ('failedSection' in form && form.failedSection === 'terms') return { failedEmployeeId: form.employeeId, message: form.message, isFailure: true };
		if ('savedSection' in form && form.savedSection === 'terms') return { failedEmployeeId: undefined, message: 'Contrats enregistrés.', isFailure: false };
		return undefined;
	});
</script>

<svelte:head>
	<title>Règles et contrats · Planning · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Règles et contrats" context="Ce que le planning proposé et les alertes respectent" icon="wrench">
	{#snippet actions()}
		<Button href={data.planningHref} variant="secondary" icon="calendar-dots">Retour au planning</Button>
	{/snippet}
</PageHeader>

<div class="grid gap-6">
	<FilterTabs label="Parties des règles du planning" {tabs} />

	{#if data.selectedTab === 'regles'}
		<section aria-labelledby="rules-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="rules-heading" class="text-heading font-semibold text-ink">Règles de la pharmacie</h2>
				<p class="text-small text-ink-muted">Le planning proposé les respecte, et vous alerte quand une semaine ne les tient pas.</p>
			</div>
			<Card>
				<PlanningRulesForm formAction={buildTabFormAction('regles', 'saveRules')} values={data.rules} errorMessage={rulesFailure} isSaved={rulesSaved} />
			</Card>
		</section>

		<section aria-labelledby="overtime-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="overtime-heading" class="text-heading font-semibold text-ink">Heures supplémentaires</h2>
				<p class="text-small text-ink-muted">
					Par défaut, celles de la convention collective de la pharmacie d’officine : 25 % de la 36e à la 43e heure, 50 % au-delà.
				</p>
			</div>
			<Card>
				<OvertimeRulesForm
					formAction={buildTabFormAction('regles', 'saveOvertimeRules')}
					values={data.overtimeRules}
					errorMessage={overtimeFailure}
					isSaved={overtimeSaved}
				/>
			</Card>
		</section>
	{:else if data.selectedTab === 'contrats'}
		<section aria-labelledby="terms-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="terms-heading" class="text-heading font-semibold text-ink">Contrats de l’équipe</h2>
				<p class="text-small text-ink-muted">Les heures au contrat et le taux horaire servent aux heures supplémentaires et au coût de la semaine.</p>
			</div>
			{#if data.employees.length === 0}
				<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe dans la fiche de la pharmacie pour renseigner ses contrats." />
			{:else}
				<EmployeeTermsList formAction={buildTabFormAction('contrats', 'saveTerms')} employees={data.employees} feedback={termsFeedback} />
			{/if}
		</section>
	{:else if data.selectedTab === 'affluence'}
		<section aria-labelledby="peaks-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="peaks-heading" class="text-heading font-semibold text-ink">Heures d’affluence</h2>
				<p class="text-small text-ink-muted">Le planning proposé place du monde en plus à ces heures, de préférence des étudiants ou les taux horaires les plus bas.</p>
			</div>
			<Card>
				<PeakWindowsSection
					addFormAction={buildTabFormAction('affluence', 'addPeakWindow')}
					removeFormAction={buildTabFormAction('affluence', 'removePeakWindow')}
					peakWindows={data.peakWindows}
					errorMessage={peaksFailure}
				/>
			</Card>
		</section>

		<section aria-labelledby="templates-heading" class="grid gap-3">
			<h2 id="templates-heading" class="text-heading font-semibold text-ink">Semaines types</h2>
			{#if data.templates.length === 0}
				<EmptyState icon="calendar-dots" title="Aucune semaine type" description="Depuis le planning, « Enregistrer comme semaine type » garde la semaine affichée pour la rejouer en un clic." />
			{:else}
				<WeekTemplatesList removeFormAction={buildTabFormAction('affluence', 'removeTemplate')} templates={data.templates} />
			{/if}
		</section>
	{:else}
		<section aria-labelledby="accountant-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="accountant-heading" class="text-heading font-semibold text-ink">Expert-comptable</h2>
				<p class="text-small text-ink-muted">
					Le planning du mois en CSV : les heures de chacun semaine par semaine, les heures supplémentaires et les absences.
					Une semaine à cheval sur deux mois compte dans le mois où elle se termine.
				</p>
			</div>
			<Card>
				<AccountantExportSection
					saveEmailFormAction={buildTabFormAction('comptable', 'saveAccountantEmail')}
					sendFormAction={buildTabFormAction('comptable', 'sendToAccountant')}
					values={data.accountantExport}
					feedback={accountantFeedback}
				/>
			</Card>
		</section>
	{/if}
</div>
