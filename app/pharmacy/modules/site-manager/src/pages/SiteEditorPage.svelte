<script lang="ts">
	import { enhance } from '$app/forms';
	import { findLayoutManifest, layoutManifests } from '@crystal-pharm/layouts/manifest';
	import { chooseDisplayedNewsSource, type NewsSource } from '@crystal-pharm/group-db/domain';
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Alert, Button, Card, ChoiceGroup, PageHeader, TextLink } from '@crystal-pharm/ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import LayoutSettingField from '../components/molecules/LayoutSettingField.svelte';
	import ArticleListEditor from '../components/organisms/ArticleListEditor.svelte';
	import GroupArticleList from '../components/organisms/GroupArticleList.svelte';
	import NewsSourceChooser from '../components/organisms/NewsSourceChooser.svelte';
	import ServiceListEditor from '../components/organisms/ServiceListEditor.svelte';
	import SitePreviewFrame from '../components/organisms/SitePreviewFrame.svelte';
	import SiteModuleToggles from '../components/organisms/SiteModuleToggles.svelte';
	import { toLayoutSettings, toLayoutSettingsFormValues, type LayoutSettingsFormValues } from '../domain/layoutSettingsForm';
	import { isArticleDraftIncomplete, isServiceDraftIncomplete } from '../domain/siteContentLists';
	import { collectAvailableModuleData, listDisplayableMandatoryModules, toTenantSiteInput } from '../domain/siteDraft';
	import { listSiteModuleChoices } from '../domain/siteModuleChoices';
	import {
		articlesFieldName,
		newsSourceFieldName,
		servicesFieldName,
		type SiteEditionFailure,
		type SiteEditionSaved,
		type SiteEditorPageData
	} from './siteEditorPageData';

	type SiteEditorPageProps = {
		data: SiteEditorPageData;
		form: SiteEditionFailure | SiteEditionSaved | null | undefined;
	};

	let { data, form }: SiteEditorPageProps = $props();

	const failure = $derived(form && 'submittedEdition' in form ? form : undefined);

	// Le formulaire part de ce qui est enregistré (ou de ce qui vient d'être refusé), puis vit sa vie.
	const initialEdition = untrack(() => failure?.submittedEdition ?? data.savedEdition);
	let layoutId = $state(initialEdition.layoutId);
	let enabledModules: ModuleName[] = $state([...initialEdition.enabledModules]);
	let services = $state(structuredClone(initialEdition.services));
	let articles = $state(structuredClone(initialEdition.articles));
	let newsSource = $state(initialEdition.newsSource);
	// Un formulaire par layout : en changer puis revenir retrouve ce qu'on y avait saisi.
	const formValuesByLayoutId: Record<string, LayoutSettingsFormValues> = $state(untrack(() => toInitialFormValuesByLayoutId()));

	let isSaving = $state(false);
	let saveOutcome: 'saved' | 'failed' | undefined = $state(untrack(() => (failure ? 'failed' : undefined)));
	// Ce qui a été enregistré en dernier, pour savoir s'il reste des changements à enregistrer.
	let savedFingerprint = $state(untrack(() => (failure ? '' : fingerprintEdition())));

	function toInitialFormValuesByLayoutId(): Record<string, LayoutSettingsFormValues> {
		const savedFormValues = Object.fromEntries(
			layoutManifests.map((manifest) => [
				manifest.layoutId,
				toLayoutSettingsFormValues(manifest.settingsFields, data.savedEdition.layoutSettingsByLayoutId[manifest.layoutId] ?? {})
			])
		);
		if (!failure) return savedFormValues;
		return { ...savedFormValues, [failure.submittedEdition.layoutId]: failure.submittedEdition.layoutSettingsFormValues };
	}

	function fingerprintEdition(): string {
		return JSON.stringify([layoutId, formValuesByLayoutId[layoutId], [...enabledModules].sort(), services, articles, newsSource]);
	}

	const layoutOptions = layoutManifests.map((manifest) => ({
		value: manifest.layoutId,
		label: manifest.label,
		description: manifest.description
	}));

	const chosenManifest = $derived(findLayoutManifest(layoutId));
	const chosenFormValues = $derived(formValuesByLayoutId[layoutId] ?? {});
	const layoutSettingsReading = $derived(chosenManifest && toLayoutSettings(chosenManifest, chosenFormValues));
	const settingsFieldErrors = $derived(layoutSettingsReading && !layoutSettingsReading.success ? layoutSettingsReading.fieldErrors : {});
	const contentDraft = $derived({ services, articles, newsSource });
	const displayedNewsSource = $derived(chooseDisplayedNewsSource(newsSource, data.base.group).source);
	const moduleChoices = $derived(listSiteModuleChoices(data.base, contentDraft));
	const previewedSite = $derived(
		layoutSettingsReading?.success
			? toTenantSiteInput(data.base, {
					layoutId,
					layoutSettings: layoutSettingsReading.layoutSettings,
					enabledModules,
					services,
					articles,
					newsSource
				})
			: undefined
	);
	const unavailableMandatoryModuleTitles = $derived.by(() => {
		const displayableMandatoryModules = listDisplayableMandatoryModules(data.base, collectAvailableModuleData(data.base, contentDraft));
		return moduleChoices
			.filter(
				(moduleChoice) =>
					data.base.group?.mandatoryModules.includes(moduleChoice.moduleName) &&
					!displayableMandatoryModules.includes(moduleChoice.moduleName)
			)
			.map((moduleChoice) => moduleChoice.title);
	});
	const hasIncompleteItem = $derived(services.some(isServiceDraftIncomplete) || articles.some(isArticleDraftIncomplete));
	const canSave = $derived(layoutSettingsReading?.success === true && !hasIncompleteItem && !isSaving);
	const hasUnsavedChanges = $derived(fingerprintEdition() !== savedFingerprint);

	function enableModule(moduleName: ModuleName): void {
		if (!enabledModules.includes(moduleName)) enabledModules.push(moduleName);
	}

	// Passer aux actualités du groupement les affiche tout de suite, comme ajouter la sienne.
	function showGroupNewsWhenAvailable(chosenNewsSource: NewsSource): void {
		if (chosenNewsSource === 'group' && (data.base.group?.articles.length ?? 0) > 0) enableModule('news');
	}

	const saveWithoutReloading: SubmitFunction = () => {
		isSaving = true;
		const submittedFingerprint = fingerprintEdition();
		return async ({ result, update }) => {
			// Les données relues mettent à jour l'en-tête ; ce qui est saisi reste tel quel.
			await update({ reset: false, invalidateAll: result.type === 'success' });
			isSaving = false;
			saveOutcome = result.type === 'success' ? 'saved' : 'failed';
			if (result.type === 'success') savedFingerprint = submittedFingerprint;
		};
	};
</script>

<svelte:window
	onbeforeunload={(event) => {
		if (hasUnsavedChanges) event.preventDefault();
	}}
/>

<div class="grid gap-6">
	<PageHeader
		title="Mon site"
		context={data.isSiteCreated ? 'Votre site public' : 'Votre site n’est pas encore en ligne'}
		icon="globe-simple"
	>
		{#snippet actions()}
			{#if data.isSiteCreated}
				<Button variant="secondary" icon="arrow-square-out" href={data.publicSiteUrl} opensInNewTab>Voir mon site</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if saveOutcome === 'saved' && !hasUnsavedChanges}
		<Alert tone="success" title="Site enregistré">
			Vos visiteurs voient maintenant cette version :
			<TextLink href={data.publicSiteUrl} opensInNewTab>voir mon site</TextLink>.
		</Alert>
	{/if}
	{#if saveOutcome === 'failed' && failure?.formError}
		<Alert tone="danger" title="Le site n’a pas été enregistré">{failure.formError}</Alert>
	{/if}
	{#if unavailableMandatoryModuleTitles.length > 0}
		<Alert tone="warning" title="Modules imposés par votre groupement, encore masqués">
			{unavailableMandatoryModuleTitles.join(', ')} : il leur manque des informations pour s’afficher.
		</Alert>
	{/if}

	<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
		<form method="POST" class="grid gap-6" use:enhance={saveWithoutReloading}>
			<input type="hidden" name={servicesFieldName} value={JSON.stringify(services)} />
			<input type="hidden" name={articlesFieldName} value={JSON.stringify(articles)} />
			<input type="hidden" name={newsSourceFieldName} value={newsSource} />

			<Card>
				<div class="grid gap-4">
					<h2 class="title-2 text-ink">Mise en page</h2>
					<ChoiceGroup name="layoutId" legend="Mise en page" options={layoutOptions} layout="cards" bind:value={layoutId} />
				</div>
			</Card>

			{#if chosenManifest && chosenManifest.settingsFields.length > 0}
				<Card>
					<div class="grid gap-4">
						<h2 class="title-2 text-ink">Réglages de « {chosenManifest.label} »</h2>
						{#each chosenManifest.settingsFields as settingsField (`${layoutId}.${settingsField.settingKey}`)}
							<LayoutSettingField
								{settingsField}
								errorMessage={settingsFieldErrors[settingsField.settingKey]}
								bind:value={
									() => chosenFormValues[settingsField.settingKey] ?? '',
									(newValue) => (chosenFormValues[settingsField.settingKey] = newValue)
								}
							/>
						{/each}
					</div>
				</Card>
			{/if}

			<Card>
				<div class="grid gap-4">
					<h2 class="title-2 text-ink">Ce qui s’affiche sur le site</h2>
					<SiteModuleToggles {moduleChoices} bind:enabledModules />
				</div>
			</Card>

			<Card>
				<div id="services" class="grid scroll-mt-6 gap-4">
					<h2 class="title-2 text-ink">Vos services</h2>
					<ServiceListEditor bind:services onserviceadded={() => enableModule('services')} />
				</div>
			</Card>

			<Card>
				<div id="actualites" class="grid scroll-mt-6 gap-4">
					<h2 class="title-2 text-ink">{data.base.group ? 'Actualités' : 'Vos actualités'}</h2>
					{#if data.base.group}
						<NewsSourceChooser group={data.base.group} bind:newsSource onchange={showGroupNewsWhenAvailable} />
					{/if}
					{#if displayedNewsSource === 'group' && data.base.group}
						<GroupArticleList groupName={data.base.group.name} articles={data.base.group.articles} />
					{:else}
						<ArticleListEditor bind:articles onarticleadded={() => enableModule('news')} />
					{/if}
				</div>
			</Card>

			<div class="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-line bg-surface p-3 shadow-card">
				<p class="text-small text-ink-muted">
					{#if isSaving}
						Enregistrement…
					{:else if hasIncompleteItem}
						Complétez ou retirez les lignes à moitié remplies.
					{:else if hasUnsavedChanges}
						Modifications non enregistrées
					{:else}
						Tout est enregistré
					{/if}
				</p>
				<Button type="submit" icon="check" disabled={!canSave || !hasUnsavedChanges}>Enregistrer le site</Button>
			</div>
		</form>

		<SitePreviewFrame frameUrl={data.preview.frameUrl} frameOrigin={data.preview.frameOrigin} tenantSite={previewedSite} />
	</div>
</div>
