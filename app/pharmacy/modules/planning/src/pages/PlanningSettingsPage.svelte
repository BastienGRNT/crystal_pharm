<script lang="ts">
	import { Button, EmptyState, FormSection, PageHeader, PageTabs, type FilterTab } from '@crystal-pharm/ui';
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
		<Button href={data.planningHref} variant="secondary" icon="calendar-dots">Voir le planning</Button>
	{/snippet}
	{#snippet navigation()}
		<PageTabs label="Parties des règles du planning" {tabs} />
	{/snippet}
</PageHeader>

<div class="grid gap-8">
	{#if data.selectedTab === 'regles'}
		<FormSection title="Règles de la pharmacie" description="Le planning proposé les respecte, et vous alerte quand une semaine ne les tient pas.">
			<PlanningRulesForm formAction={buildTabFormAction('regles', 'saveRules')} values={data.rules} errorMessage={rulesFailure} isSaved={rulesSaved} />
		</FormSection>

		<FormSection
			title="Heures supplémentaires"
			description="Par défaut, celles de la convention de l’officine : 25 % de la 36e à la 43e heure, 50 % au-delà."
		>
			<OvertimeRulesForm
				formAction={buildTabFormAction('regles', 'saveOvertimeRules')}
				values={data.overtimeRules}
				errorMessage={overtimeFailure}
				isSaved={overtimeSaved}
			/>
		</FormSection>
	{:else if data.selectedTab === 'contrats'}
		<section aria-labelledby="terms-heading" class="grid gap-3">
			<div class="grid gap-0.5">
				<h2 id="terms-heading" class="font-display text-[22px] leading-7 text-ink">Contrats de l’équipe</h2>
				<p class="text-small text-ink-muted">Les heures au contrat et le taux horaire servent aux heures supplémentaires et au coût de la semaine.</p>
			</div>
			{#if data.employees.length === 0}
				<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe dans la fiche de la pharmacie pour renseigner ses contrats." />
			{:else}
				<EmployeeTermsList formAction={buildTabFormAction('contrats', 'saveTerms')} employees={data.employees} feedback={termsFeedback} />
			{/if}
		</section>
	{:else if data.selectedTab === 'affluence'}
		<FormSection
			title="Heures d’affluence"
			description="Le planning proposé y place du monde en plus, de préférence des étudiants ou les taux horaires les plus bas."
		>
			<PeakWindowsSection
				addFormAction={buildTabFormAction('affluence', 'addPeakWindow')}
				removeFormAction={buildTabFormAction('affluence', 'removePeakWindow')}
				peakWindows={data.peakWindows}
				errorMessage={peaksFailure}
			/>
		</FormSection>

		<FormSection title="Semaines types" description="Une semaine gardée depuis le planning, à rejouer en un clic.">
			{#if data.templates.length === 0}
				<p class="text-body text-ink-muted">
					Aucune semaine type. Depuis le planning, « Enregistrer comme semaine type » garde la semaine affichée.
				</p>
			{:else}
				<WeekTemplatesList removeFormAction={buildTabFormAction('affluence', 'removeTemplate')} templates={data.templates} />
			{/if}
		</FormSection>
	{:else}
		<FormSection
			title="Expert-comptable"
			description="Le mois en CSV : les heures de chacun, les heures supplémentaires et les absences. Une semaine à cheval compte dans le mois où elle se termine."
		>
			<AccountantExportSection
				saveEmailFormAction={buildTabFormAction('comptable', 'saveAccountantEmail')}
				sendFormAction={buildTabFormAction('comptable', 'sendToAccountant')}
				values={data.accountantExport}
				feedback={accountantFeedback}
			/>
		</FormSection>
	{/if}
</div>
