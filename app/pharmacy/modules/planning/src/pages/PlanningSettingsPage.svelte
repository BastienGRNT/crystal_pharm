<script lang="ts">
	import { Button, Card, EmptyState, PageHeader } from '@crystal-pharm/ui';
	import EmployeeTermsList from '../components/organisms/settings/EmployeeTermsList.svelte';
	import PlanningRulesForm from '../components/organisms/settings/PlanningRulesForm.svelte';
	import type { PlanningSettingsActionResult, PlanningSettingsPageData } from './planningSettingsPageData';

	type PlanningSettingsPageProps = {
		data: PlanningSettingsPageData;
		form: PlanningSettingsActionResult | null | undefined;
	};

	let { data, form }: PlanningSettingsPageProps = $props();

	const rulesFailure = $derived(form && 'failedSection' in form && form.failedSection === 'rules' ? form.message : undefined);
	const rulesSaved = $derived(form !== null && form !== undefined && 'savedSection' in form && form.savedSection === 'rules');
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

	<section aria-labelledby="terms-heading" class="grid gap-3">
		<h2 id="terms-heading" class="text-heading font-semibold text-ink">Contrats de l’équipe</h2>
		{#if data.employees.length === 0}
			<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe dans la fiche de la pharmacie pour renseigner ses contrats." />
		{:else}
			<EmployeeTermsList formAction="?/saveTerms" employees={data.employees} feedback={termsFeedback} />
		{/if}
	</section>
</div>
