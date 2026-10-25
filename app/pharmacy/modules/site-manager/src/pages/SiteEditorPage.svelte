<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { findLayoutManifest, layoutManifests, type LayoutSettingsField } from '@crystal-pharm/layouts/manifest';
	import { chooseDisplayedNewsSource, type NewsSource } from '@crystal-pharm/group-db/domain';
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Alert, Button, ChoiceGroup, PageHeader, Switch, Tag, TextLink, type IconName } from '@crystal-pharm/ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import EditorRailItem from '../components/molecules/EditorRailItem.svelte';
	import LayoutSettingField from '../components/molecules/LayoutSettingField.svelte';
	import ArticleListEditor from '../components/organisms/ArticleListEditor.svelte';
	import GroupArticleList from '../components/organisms/GroupArticleList.svelte';
	import NewsSourceChooser from '../components/organisms/NewsSourceChooser.svelte';
	import ServiceListEditor from '../components/organisms/ServiceListEditor.svelte';
	import SitePreviewFrame from '../components/organisms/SitePreviewFrame.svelte';
	import { toLayoutSettings, toLayoutSettingsFormValues, type LayoutSettingsFormValues } from '../domain/layoutSettingsForm';
	import { isArticleDraftIncomplete, isServiceDraftIncomplete } from '../domain/siteContentLists';
	import { collectAvailableModuleData, listDisplayableMandatoryModules, toTenantSiteInput } from '../domain/siteDraft';
	import { listSiteModuleChoices, type SiteModuleChoice } from '../domain/siteModuleChoices';
	import {
		articlesFieldName,
		newsSourceFieldName,
		servicesFieldName,
		siteAddressPathname,
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
	const themeSettingsFields = $derived(chosenManifest?.settingsFields.filter((settingsField) => settingsField.isThemeSetting) ?? []);
	const otherSettingsFields = $derived(chosenManifest?.settingsFields.filter((settingsField) => !settingsField.isThemeSetting) ?? []);
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

	type MobileView = 'edition' | 'apercu';

	const mobileViewOptions = [
		{ value: 'edition', label: 'Édition' },
		{ value: 'apercu', label: 'Aperçu' }
	];
	const appearancePanelId = 'apparence';
	const displayPanelId = 'display';
	const panelsWithOwnEditor: ModuleName[] = ['services', 'news'];
	// `#services` et `#actualites` existaient déjà comme ancres : elles ouvrent le bloc concerné.
	const panelIdByHash: Record<string, string> = { services: 'services', actualites: 'news' };
	const railIconByPanelId: Record<typeof appearancePanelId | typeof displayPanelId | 'services' | 'news', IconName> = {
		apparence: 'sparkle',
		services: 'seal-check',
		news: 'file-text',
		display: 'globe-simple'
	};

	// Les panneaux restent montés, cachés : leurs champs partent avec le formulaire.
	let selectedPanelId = $state('services');
	let mobileView = $state<MobileView>('edition' as MobileView);

	function selectPanel(panelId: string): void {
		selectedPanelId = panelId;
	}

	function selectPanelOfLocationHash(): void {
		const hash = window.location.hash.slice(1);
		const panelId = panelIdByHash[hash] ?? (hash === 'affichage' ? displayPanelId : hash);
		if (panelId in railIconByPanelId) selectPanel(panelId);
	}

	// SvelteKit intercepte les liens d'ancre : le clic passe par afterNavigate, le retour arrière par hashchange.
	afterNavigate(selectPanelOfLocationHash);

	const settingsErrorCount = $derived(Object.keys(settingsFieldErrors).length);

	function isModuleChecked(moduleChoice: SiteModuleChoice): boolean {
		if (moduleChoice.state.kind === 'mandatory') return true;
		if (moduleChoice.state.kind === 'unavailable') return false;
		return enabledModules.includes(moduleChoice.moduleName);
	}

	function setModuleChecked(moduleName: ModuleName, isNowChecked: boolean): void {
		const otherModules = enabledModules.filter((enabledModule) => enabledModule !== moduleName);
		enabledModules = isNowChecked ? [...otherModules, moduleName] : otherModules;
	}

	function countLabel(count: number, none: string, singular: string, plural: string): string {
		if (count === 0) return none;
		return `${count} ${count > 1 ? plural : singular}`;
	}

	const servicesSummary = $derived(countLabel(services.length, 'Aucun service', 'service', 'services'));
	const newsSummary = $derived(
		displayedNewsSource === 'group' && data.base.group
			? `Celles de ${data.base.group.name}`
			: countLabel(articles.length, 'Aucune actualité', 'actualité', 'actualités')
	);

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
	onhashchange={selectPanelOfLocationHash}
	onbeforeunload={(event) => {
		if (hasUnsavedChanges) event.preventDefault();
	}}
/>

<div class="grid gap-4 lg:mr-[calc(45vw-0.75rem)]">
	<PageHeader
		title="Mon site"
		context={data.isSiteCreated ? 'Votre site public' : 'Votre site n’est pas encore en ligne'}
		icon="globe-simple"
	>
		{#snippet actions()}
			{#if data.publicSiteUrl}
				<Button variant="ghost" href={siteAddressPathname}>Changer d’adresse</Button>
				<Button variant="secondary" icon="arrow-square-out" href={data.publicSiteUrl} opensInNewTab>Voir mon site</Button>
			{:else}
				<Button variant="primary" icon="globe-simple" href={siteAddressPathname}>Choisir l’adresse et mettre en ligne</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if saveOutcome === 'failed' && failure?.formError}
		<Alert tone="danger" title="Le site n’a pas été enregistré">{failure.formError}</Alert>
	{/if}
	{#if unavailableMandatoryModuleTitles.length > 0}
		<Alert tone="warning" title="Modules imposés par votre groupement, encore masqués">
			{unavailableMandatoryModuleTitles.join(', ')} : il leur manque des informations pour s’afficher.
		</Alert>
	{/if}

	<div class="grid items-start gap-6">
		<div class="grid gap-4">
			<div class="lg:hidden">
			<ChoiceGroup name="mobileView" legend="Édition ou aperçu" options={mobileViewOptions} bind:value={mobileView} />
		</div>
		<form
			method="POST"
			class="content-start gap-4 lg:grid-cols-[84px_minmax(0,1fr)] {mobileView === 'edition' ? 'grid' : 'hidden lg:grid'}"
			use:enhance={saveWithoutReloading}
		>
			<input type="hidden" name={servicesFieldName} value={JSON.stringify(services)} />
			<input type="hidden" name={articlesFieldName} value={JSON.stringify(articles)} />
			<input type="hidden" name={newsSourceFieldName} value={newsSource} />
			{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
				{#if moduleChoice.state.kind === 'optional' && enabledModules.includes(moduleChoice.moduleName)}
					<input type="hidden" name="enabledModules" value={moduleChoice.moduleName} />
				{/if}
			{/each}

			{#snippet moduleSwitch(moduleChoice: SiteModuleChoice)}
				{#if moduleChoice.state.kind === 'mandatory'}
					<Tag tone="accent">Imposé par {moduleChoice.state.groupName}</Tag>
				{:else if moduleChoice.state.kind === 'optional'}
					<Switch
						label={isModuleChecked(moduleChoice) ? 'Affiché sur le site' : 'Masqué'}
						accessibleLabel="Afficher « {moduleChoice.title} » sur le site"
						bind:checked={() => isModuleChecked(moduleChoice), (isNowChecked) => setModuleChecked(moduleChoice.moduleName, isNowChecked)}
					/>
				{:else}
					<Tag tone="warning">À compléter</Tag>
				{/if}
			{/snippet}

			{#snippet panelHeader(title: string, description: string, moduleChoice?: SiteModuleChoice)}
				<header class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
					<div class="min-w-0">
						<h2 class="title-2 text-ink">{title}</h2>
						<p class="text-small text-ink-muted">{description}</p>
					</div>
					{#if moduleChoice}{@render moduleSwitch(moduleChoice)}{/if}
				</header>
			{/snippet}

			{#snippet layoutSettingsFields(title: string, settingsFields: LayoutSettingsField[])}
				<div class="grid gap-3">
					<p class="body-strong text-ink">{title}</p>
					<div class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
						{#each settingsFields as settingsField (`${layoutId}.${settingsField.settingKey}`)}
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
				</div>
			{/snippet}

			<nav
				aria-label="Blocs du site"
				class="grid grid-cols-4 gap-1 rounded-lg border border-line bg-surface p-1.5 shadow-card lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:grid-cols-1 lg:self-start"
			>
				<EditorRailItem
					icon={railIconByPanelId[appearancePanelId]}
					label="Style"
					isSelected={selectedPanelId === appearancePanelId}
					status={settingsErrorCount > 0 ? 'error' : undefined}
					onselect={() => selectPanel(appearancePanelId)}
				/>
				{#each moduleChoices.filter((moduleChoice) => panelsWithOwnEditor.includes(moduleChoice.moduleName)) as moduleChoice (moduleChoice.moduleName)}
					<EditorRailItem
						icon={railIconByPanelId[moduleChoice.moduleName as 'services' | 'news']}
						label={moduleChoice.title}
						isSelected={selectedPanelId === moduleChoice.moduleName}
						status={moduleChoice.state.kind === 'unavailable' ||
						(moduleChoice.moduleName === 'services' && services.some(isServiceDraftIncomplete)) ||
						(moduleChoice.moduleName === 'news' && articles.some(isArticleDraftIncomplete))
							? 'attention'
							: isModuleChecked(moduleChoice)
								? 'visible'
								: 'hidden'}
						onselect={() => selectPanel(moduleChoice.moduleName)}
					/>
				{/each}
				<EditorRailItem
					icon={railIconByPanelId[displayPanelId]}
					label="Affichage"
					isSelected={selectedPanelId === displayPanelId}
					onselect={() => selectPanel(displayPanelId)}
				/>
			</nav>

			<div class="grid min-w-0 content-start gap-4">
				<div class="grid content-start gap-4 {selectedPanelId === appearancePanelId ? '' : 'hidden'}">
					{@render panelHeader('Style du site', 'La mise en page, les couleurs et les polices.')}
					<ChoiceGroup name="layoutId" legend="Mise en page" options={layoutOptions} layout="cards" bind:value={layoutId} />
					{#if chosenManifest && themeSettingsFields.length > 0}
						{@render layoutSettingsFields('Couleurs et polices', themeSettingsFields)}
					{/if}
					{#if chosenManifest && otherSettingsFields.length > 0}
						{@render layoutSettingsFields('Autres réglages', otherSettingsFields)}
					{/if}
				</div>

				{#each moduleChoices.filter((moduleChoice) => panelsWithOwnEditor.includes(moduleChoice.moduleName)) as moduleChoice (moduleChoice.moduleName)}
					<div
						id={moduleChoice.moduleName === 'news' ? 'actualites' : moduleChoice.moduleName}
						class="grid scroll-mt-16 content-start gap-4 {selectedPanelId === moduleChoice.moduleName ? '' : 'hidden'}"
					>
						{@render panelHeader(moduleChoice.title, moduleChoice.moduleName === 'services' ? servicesSummary : moduleChoice.moduleName === 'news' ? newsSummary : moduleChoice.description, moduleChoice)}
						{#if moduleChoice.moduleName === 'services'}
							<ServiceListEditor bind:services onserviceadded={() => enableModule('services')} />
						{:else if moduleChoice.moduleName === 'news'}
							{#if data.base.group}
								<NewsSourceChooser group={data.base.group} bind:newsSource onchange={showGroupNewsWhenAvailable} />
							{/if}
							{#if displayedNewsSource === 'group' && data.base.group}
								<GroupArticleList groupName={data.base.group.name} articles={data.base.group.articles} />
							{:else}
								<ArticleListEditor bind:articles onarticleadded={() => enableModule('news')} />
							{/if}
						{/if}
					</div>
				{/each}

				<div class="grid content-start gap-4 {selectedPanelId === displayPanelId ? '' : 'hidden'}">
					{@render panelHeader('Affichage', 'Choisissez les blocs que votre site montre à vos visiteurs.')}
					<div class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
						{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
							<div class="flex items-center gap-3 px-4 py-3">
								<div class="min-w-0 flex-1">
									<p class="body-strong text-ink">{moduleChoice.title}</p>
									<p class="text-small text-ink-muted">
										{moduleChoice.state.kind === 'unavailable' ? moduleChoice.state.reason : moduleChoice.description}
										{#if moduleChoice.state.kind === 'unavailable' && moduleChoice.state.fixHref}
											<TextLink href={moduleChoice.state.fixHref}>Y aller</TextLink>
										{/if}
									</p>
								</div>
								{#if panelsWithOwnEditor.includes(moduleChoice.moduleName)}
									<Button variant="ghost" onclick={() => selectPanel(moduleChoice.moduleName)}>Modifier</Button>
								{/if}
								{@render moduleSwitch(moduleChoice)}
							</div>
						{/each}
					</div>
				</div>

			<div class="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-line bg-surface p-3 shadow-card">
				<p class="text-small text-ink-muted">
					{#if isSaving}
						Enregistrement…
					{:else if settingsErrorCount > 0}
						Corrigez les réglages signalés dans Apparence.
					{:else if hasIncompleteItem}
						Complétez ou retirez les lignes à moitié remplies.
					{:else if hasUnsavedChanges}
						Modifications non enregistrées
					{:else if saveOutcome === 'saved'}
						Site enregistré.
						{#if data.publicSiteUrl}
							<TextLink href={data.publicSiteUrl} opensInNewTab>Voir mon site</TextLink>
						{:else}
							<TextLink href={siteAddressPathname}>Choisir l’adresse de mon site</TextLink>
						{/if}
					{:else}
						Tout est enregistré
					{/if}
				</p>
				<Button type="submit" icon="check" disabled={!canSave || !hasUnsavedChanges}>Enregistrer le site</Button>
			</div>
			</div>
		</form>
		</div>

		<div class="{mobileView === 'apercu' ? 'block' : 'hidden lg:block'}">
			<SitePreviewFrame frameUrl={data.preview.frameUrl} frameOrigin={data.preview.frameOrigin} tenantSite={previewedSite} />
		</div>
	</div>
</div>
