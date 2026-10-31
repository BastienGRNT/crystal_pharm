<script lang="ts">
	import { Button, Card, EmptyState, PageHeader } from '@crystal-pharm/ui';
	import PeakWindowsSection from '../components/organisms/settings/PeakWindowsSection.svelte';
	import WeekTemplatesList from '../components/organisms/settings/WeekTemplatesList.svelte';
	import EmployeeTermsList from '../components/organisms/settings/EmployeeTermsList.svelte';
	import PlanningRulesForm from '../components/organisms/settings/PlanningRulesForm.svelte';
	import OvertimeRulesForm from '../components/organisms/settings/OvertimeRulesForm.svelte';
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
	const peaksFailure = $derived(form && 'failedSection' in form && form.failedSection === 'peaks' ? form.message : undefined);
	const termsFeedback = $derived.by(() => {
		if (!form) return undefined;
		if ('failedSection' in form && form.failedSection === 'terms') return { employeeId: form.employeeId, message: form.message };
		if ('savedSection' in form && form.savedSection === 'terms') return { employeeId: form.employeeId, message: 'Enregistré.' };
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
	<section aria-labelledby="rules-heading" class="grid gap-3">
		<h2 id="rules-heading" class="text-heading font-semibold text-ink">Règles de la pharmacie</h2>
		<Card>
			<PlanningRulesForm formAction="?/saveRules" values={data.rules} errorMessage={rulesFailure} isSaved={rulesSaved} />
		</Card>
	</section>

	<section aria-labelledby="overtime-heading" class="grid gap-3">
		<h2 id="overtime-heading" class="text-heading font-semibold text-ink">Heures supplémentaires</h2>
		<p class="text-small text-ink-muted">
			Par défaut, celles de la convention collective de la pharmacie d’officine : 25 % de la 36e à la 43e heure, 50 % au-delà.
			Le planning les calcule semaine par semaine, et le taux horaire de chacun monte avec ses heures.
		</p>
		<Card>
			<OvertimeRulesForm formAction="?/saveOvertimeRules" values={data.overtimeRules} errorMessage={overtimeFailure} isSaved={overtimeSaved} />
		</Card>
	</section>

	<section aria-labelledby="peaks-heading" class="grid gap-3">
		<h2 id="peaks-heading" class="text-heading font-semibold text-ink">Heures de pointe</h2>
		<p class="text-small text-ink-muted">Le planning proposé place du monde en plus à ces heures, de préférence des étudiants ou les taux horaires les plus bas.</p>
		<Card>
			<PeakWindowsSection addFormAction="?/addPeakWindow" removeFormAction="?/removePeakWindow" peakWindows={data.peakWindows} errorMessage={peaksFailure} />
		</Card>
	</section>

	<section aria-labelledby="templates-heading" class="grid gap-3">
		<h2 id="templates-heading" class="text-heading font-semibold text-ink">Semaines types</h2>
		{#if data.templates.length === 0}
			<EmptyState icon="calendar-dots" title="Aucune semaine type" description="Depuis le planning, « Enregistrer comme semaine type » garde la semaine affichée pour la rejouer en un clic." />
		{:else}
			<WeekTemplatesList removeFormAction="?/removeTemplate" templates={data.templates} />
		{/if}
	</section>

	<section aria-labelledby="terms-heading" class="grid gap-3">
		<h2 id="terms-heading" class="text-heading font-semibold text-ink">Contrats de l’équipe</h2>
		{#if data.employees.length === 0}
			<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe dans la fiche de la pharmacie pour renseigner ses contrats." />
		{:else}
			<EmployeeTermsList formAction="?/saveTerms" employees={data.employees} feedback={termsFeedback} />
		{/if}
	</section>
</div>
