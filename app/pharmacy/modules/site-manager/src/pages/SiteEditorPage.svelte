<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { findLayoutManifest, layoutManifests, type LayoutSettingsField } from '@crystal-pharm/layouts/manifest';
	import { chooseDisplayedNewsSource, type NewsSource } from '@crystal-pharm/group-db/domain';
	import type { ModuleName } from '@crystal-pharm/schema';
	import {
		Alert,
		Button,
		ChoiceGroup,
		FloatingIsland,
		Icon,
		IconButton,
		ResizableViewport,
		ResizeHandle,
		SegmentedToggle,
		Switch,
		Tag,
		TextLink,
		UnsavedChangesGuard,
		type IconName,
		type SegmentedToggleOption,
		type ViewportPreset,
		type ViewportZoom
	} from '@crystal-pharm/ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onMount, untrack } from 'svelte';
	import EditorBlockRow from '../components/molecules/EditorBlockRow.svelte';
	import LayoutSettingField from '../components/molecules/LayoutSettingField.svelte';
	import AppointmentEditor from '../components/organisms/AppointmentEditor.svelte';
	import ArticleListEditor from '../components/organisms/ArticleListEditor.svelte';
	import BrandListEditor from '../components/organisms/BrandListEditor.svelte';
	import FindUsEditor from '../components/organisms/FindUsEditor.svelte';
	import GroupArticleList from '../components/organisms/GroupArticleList.svelte';
	import HeroEditor from '../components/organisms/HeroEditor.svelte';
	import ModuleOrderList from '../components/organisms/ModuleOrderList.svelte';
	import NewsSourceChooser from '../components/organisms/NewsSourceChooser.svelte';
	import OnlineOrderEditor from '../components/organisms/OnlineOrderEditor.svelte';
	import ServiceListEditor from '../components/organisms/ServiceListEditor.svelte';
	import SitePreviewFrame from '../components/organisms/SitePreviewFrame.svelte';
	import { toLayoutSettings, toLayoutSettingsFormValues, upgradeStoredLayoutSettings, type LayoutSettingsFormValues } from '../domain/layoutSettingsForm';
	import { applyThemePreset, findMatchingThemePreset } from '../domain/themePresets';
	import { listContrastWarnings } from '../domain/themeContrast';
	import {
		findEditorBlockOfHash,
		findNeighbourEditorBlocks,
		listEditorBlockIds,
		toEditorBlockHash,
		type EditorBlockId
	} from '../domain/site-editor/editorBlocks';
	import { isArticleDraftIncomplete, isBrandAddressInvalid, isBrandDraftIncomplete, isServiceDraftIncomplete } from '../domain/siteContentLists';
	import { toTenantSiteInput, type SiteEditorBase } from '../domain/siteDraft';
	import { listSiteModuleChoices, type SiteModuleChoice } from '../domain/siteModuleChoices';
	import {
		articlesFieldName,
		brandsFieldName,
		moduleOrderFieldName,
		newsSourceFieldName,
		sectionsFieldName,
		servicesFieldName,
		siteAddressPathname,
		type SiteEditionFailure,
		type SiteEditionSaved,
		type SiteEditorPageData,
		type SiteImageUploaded,
		type SiteImageUploadFailure
	} from './siteEditorPageData';
	import { siteOverviewPathname } from './siteOverviewPageData';

	type SiteEditorPageProps = {
		data: SiteEditorPageData;
		form: SiteEditionFailure | SiteEditionSaved | SiteImageUploaded | SiteImageUploadFailure | null | undefined;
	};

	let { data, form }: SiteEditorPageProps = $props();

	const failure = $derived(form && 'submittedEdition' in form ? form : undefined);

	// Le formulaire part de ce qui est enregistré (ou de ce qui vient d'être refusé), puis vit sa vie.
	const initialEdition = untrack(() => failure?.submittedEdition ?? data.savedEdition);
	let layoutId = $state(initialEdition.layoutId);
	let enabledModules: ModuleName[] = $state([...initialEdition.enabledModules]);
	let moduleOrder: ModuleName[] = $state([...initialEdition.moduleOrder]);
	let sections = $state(structuredClone(initialEdition.sections));
	let services = $state(structuredClone(initialEdition.services));
	let brands = $state(structuredClone(initialEdition.brands));
	let articles = $state(structuredClone(initialEdition.articles));
	let newsSource = $state(initialEdition.newsSource);
	// Les images envoyées ici s'ajoutent à celles déjà enregistrées : l'aperçu les montre avant l'enregistrement.
	let uploadedImagePreviewUrls: Record<string, string> = $state(untrack(() => ({ ...data.base.uploadedImagePreviewUrls })));
	const editorBase: SiteEditorBase = $derived({ ...data.base, uploadedImagePreviewUrls });
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
				toLayoutSettingsFormValues(manifest.settingsFields, upgradeStoredLayoutSettings(manifest, data.savedEdition.layoutSettingsByLayoutId[manifest.layoutId] ?? {}))
			])
		);
		if (!failure) return savedFormValues;
		return { ...savedFormValues, [failure.submittedEdition.layoutId]: failure.submittedEdition.layoutSettingsFormValues };
	}

	function fingerprintEdition(): string {
		return JSON.stringify([layoutId, formValuesByLayoutId[layoutId], [...enabledModules].sort(), moduleOrder, sections, services, brands, articles, newsSource]);
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
	const themePresets = $derived(chosenManifest?.themePresets ?? []);
	const matchingThemePreset = $derived(findMatchingThemePreset(themePresets, chosenFormValues));
	const contrastWarnings = $derived(listContrastWarnings(chosenManifest?.themeContrastPairs ?? [], chosenFormValues));
	const layoutSettingsReading = $derived(chosenManifest && toLayoutSettings(chosenManifest, chosenFormValues));
	const settingsFieldErrors = $derived(layoutSettingsReading && !layoutSettingsReading.success ? layoutSettingsReading.fieldErrors : {});
	const contentDraft = $derived({ layoutId, sections, services, brands, articles, newsSource });
	const displayedNewsSource = $derived(chooseDisplayedNewsSource(newsSource, data.base.group).source);
	const moduleChoices = $derived(listSiteModuleChoices(editorBase, contentDraft));
	const previewedSite = $derived(
		layoutSettingsReading?.success
			? toTenantSiteInput(editorBase, {
					layoutId,
					layoutSettings: layoutSettingsReading.layoutSettings,
					enabledModules,
					moduleOrder,
					sections,
					services,
					brands,
					articles,
					newsSource
				})
			: undefined
	);
	const unavailableMandatoryModuleTitles = $derived(
		moduleChoices
			.filter(
				(moduleChoice) =>
					moduleChoice.state.kind === 'unavailable' && data.base.group?.mandatoryModules.includes(moduleChoice.moduleName)
			)
			.map((moduleChoice) => moduleChoice.title)
	);
	const hasIncompleteItem = $derived(
		services.some(isServiceDraftIncomplete) ||
			articles.some(isArticleDraftIncomplete) ||
			brands.some((brand) => isBrandDraftIncomplete(brand) || isBrandAddressInvalid(brand))
	);
	const canSave = $derived(layoutSettingsReading?.success === true && !hasIncompleteItem && !isSaving);
	const hasUnsavedChanges = $derived(fingerprintEdition() !== savedFingerprint);
	const settingsErrorCount = $derived(Object.keys(settingsFieldErrors).length);

	function enableModule(moduleName: ModuleName): void {
		if (!enabledModules.includes(moduleName)) enabledModules.push(moduleName);
	}

	// Passer aux actualités du groupement les affiche tout de suite, comme ajouter la sienne.
	function showGroupNewsWhenAvailable(chosenNewsSource: NewsSource): void {
		if (chosenNewsSource === 'group' && (data.base.group?.articles.length ?? 0) > 0) enableModule('news');
	}

	function isModuleChecked(moduleChoice: SiteModuleChoice): boolean {
		if (moduleChoice.state.kind === 'mandatory') return true;
		if (moduleChoice.state.kind === 'unavailable') return false;
		return enabledModules.includes(moduleChoice.moduleName);
	}

	function setModuleChecked(moduleName: ModuleName, isNowChecked: boolean): void {
		const otherModules = enabledModules.filter((enabledModule) => enabledModule !== moduleName);
		enabledModules = isNowChecked ? [...otherModules, moduleName] : otherModules;
	}

	function hasIncompleteItemIn(moduleName: ModuleName): boolean {
		if (moduleName === 'services') return services.some(isServiceDraftIncomplete);
		if (moduleName === 'news') return articles.some(isArticleDraftIncomplete);
		if (moduleName === 'brands') return brands.some((brand) => isBrandDraftIncomplete(brand) || isBrandAddressInvalid(brand));
		return false;
	}

	function countLabel(count: number, none: string, singular: string, plural: string): string {
		if (count === 0) return none;
		return `${count} ${count > 1 ? plural : singular}`;
	}

	// --- Les blocs : la liste à gauche, un panneau à la fois au milieu.

	const modulesWithOwnEditor: ModuleName[] = ['services', 'news', 'brands', 'appointment', 'onlineOrder'];
	const blockIcons: Record<EditorBlockId, IconName> = {
		appearance: 'sparkle',
		hero: 'house',
		findUs: 'map-pin',
		display: 'eye',
		team: 'users-three',
		services: 'seal-check',
		news: 'newspaper',
		prescriptionUpload: 'prescription',
		brands: 'storefront',
		appointment: 'calendar-check',
		onlineOrder: 'package',
		dutyHotline: 'moon',
		loyaltyCard: 'gift'
	};

	const blockIds = $derived(listEditorBlockIds(moduleOrder));
	const moduleChoiceByName = $derived(new Map(moduleChoices.map((moduleChoice) => [moduleChoice.moduleName, moduleChoice])));
	const moduleTitles = $derived(Object.fromEntries(moduleChoices.map((moduleChoice) => [moduleChoice.moduleName, moduleChoice.title])));
	const shownModuleCount = $derived(moduleChoices.filter(isModuleChecked).length);

	// Les panneaux restent montés, cachés : leurs champs partent avec le formulaire.
	let selectedBlockId: EditorBlockId = $state('appearance');
	const neighbourBlocks = $derived(findNeighbourEditorBlocks(blockIds, selectedBlockId));
	let panelScroller: HTMLElement | undefined = $state();

	function moduleChoiceOf(blockId: EditorBlockId): SiteModuleChoice | undefined {
		return moduleChoiceByName.get(blockId as ModuleName);
	}

	function titleOfBlock(blockId: EditorBlockId): string {
		if (blockId === 'appearance') return 'Style';
		if (blockId === 'hero') return 'Accueil';
		if (blockId === 'findUs') return 'Nous trouver';
		if (blockId === 'display') return 'Affichage et ordre';
		return moduleTitles[blockId] ?? blockId;
	}

	function summarizeModule(moduleChoice: SiteModuleChoice): string {
		if (moduleChoice.state.kind === 'unavailable') return 'À compléter';
		if (hasIncompleteItemIn(moduleChoice.moduleName)) return 'Des lignes à compléter';
		const visibility = moduleChoice.state.kind === 'mandatory' ? 'Imposé' : isModuleChecked(moduleChoice) ? 'Affiché' : 'Masqué';
		const content = describeModuleContent(moduleChoice.moduleName);
		return content ? `${visibility} · ${content}` : visibility;
	}

	function describeModuleContent(moduleName: ModuleName): string | undefined {
		if (moduleName === 'services') return countLabel(services.length, 'aucun service', 'service', 'services');
		if (moduleName === 'brands') return countLabel(brands.length, 'aucune marque', 'marque', 'marques');
		if (moduleName === 'news') {
			if (displayedNewsSource === 'group' && data.base.group) return `celles de ${data.base.group.name}`;
			return countLabel(articles.length, 'aucune actualité', 'actualité', 'actualités');
		}
		return undefined;
	}

	function summarizeBlock(blockId: EditorBlockId): string {
		if (blockId === 'appearance') return settingsErrorCount > 0 ? 'Réglages à corriger' : (chosenManifest?.label ?? '');
		if (blockId === 'hero' || blockId === 'findUs') return 'Toujours affiché';
		if (blockId === 'display') return countLabel(shownModuleCount, 'Aucun bloc affiché', 'bloc affiché', 'blocs affichés');
		const moduleChoice = moduleChoiceOf(blockId);
		return moduleChoice ? summarizeModule(moduleChoice) : '';
	}

	function statusOfBlock(blockId: EditorBlockId): 'visible' | 'hidden' | 'attention' | 'error' | undefined {
		if (blockId === 'appearance') return settingsErrorCount > 0 ? 'error' : undefined;
		const moduleChoice = moduleChoiceOf(blockId);
		if (!moduleChoice) return undefined;
		if (moduleChoice.state.kind === 'unavailable' || hasIncompleteItemIn(moduleChoice.moduleName)) return 'attention';
		return isModuleChecked(moduleChoice) ? 'visible' : 'hidden';
	}

	function showBlock(blockId: EditorBlockId): void {
		selectedBlockId = blockId;
		panelScroller?.scrollTo({ top: 0 });
	}

	// L'ancre suit le bloc ouvert : recharger la page, ou partager le lien, y ramène.
	function selectBlock(blockId: EditorBlockId): void {
		showBlock(blockId);
		mobileView = 'edition';
		if (editorView === 'immersive') openIslandSheet('edition');
		replaceState(`#${toEditorBlockHash(blockId)}`, {});
	}

	function showBlockOfLocationHash(): void {
		const blockId = findEditorBlockOfHash(window.location.hash);
		if (blockId) showBlock(blockId);
	}

	// SvelteKit intercepte les liens d'ancre : le clic passe par afterNavigate, le retour arrière par hashchange.
	afterNavigate(showBlockOfLocationHash);

	// --- L'enregistrement.

	let editionForm: HTMLFormElement | undefined = $state();

	const saveWithoutReloading: SubmitFunction = () => {
		isSaving = true;
		const submittedFingerprint = fingerprintEdition();
		return async ({ result, update }) => {
			// Les données relues mettent à jour l'adresse du site ; ce qui est saisi reste tel quel.
			await update({ reset: false, invalidateAll: result.type === 'success' });
			isSaving = false;
			saveOutcome = result.type === 'success' ? 'saved' : 'failed';
			if (result.type === 'success') savedFingerprint = submittedFingerprint;
		};
	};

	function handleShortcuts(event: KeyboardEvent): void {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
			event.preventDefault();
			if (canSave && hasUnsavedChanges) editionForm?.requestSubmit();
			return;
		}
		if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
			const neighbourBlockId = event.key === 'ArrowDown' ? neighbourBlocks.next : neighbourBlocks.previous;
			if (!neighbourBlockId) return;
			event.preventDefault();
			selectBlock(neighbourBlockId);
		}
	}

	// --- La mise en page de l'éditeur : la largeur du panneau, l'écran simulé, gardés d'une visite à l'autre.

	type MobileView = 'edition' | 'apercu';
	let mobileView: MobileView = $state('edition');
	const mobileViewOptions: SegmentedToggleOption<MobileView>[] = [
		{ value: 'edition', label: 'Édition', icon: 'pencil-simple' },
		{ value: 'apercu', label: 'Aperçu', icon: 'eye' }
	];

	// Les panneaux en colonnes, ou le site en plein écran avec l'édition dans un îlot flottant.
	type EditorView = 'panels' | 'immersive';
	let editorView: EditorView = $state('panels');

	type IslandSheet = 'blocks' | 'edition';
	let islandSheet: IslandSheet = $state('blocks');
	let isIslandExpanded = $state(false);

	function openIslandSheet(sheet: IslandSheet): void {
		islandSheet = sheet;
		isIslandExpanded = true;
	}

	function toggleIslandSheet(sheet: IslandSheet): void {
		if (isIslandExpanded && islandSheet === sheet) isIslandExpanded = false;
		else openIslandSheet(sheet);
	}

	function showPreviewAt(width: number): void {
		previewWidth = width;
		previewZoom = 'fit';
	}

	const viewportPresets: ViewportPreset[] = [
		{ label: 'Mobile', width: 390, icon: 'device-mobile' },
		{ label: 'Tablette', width: 820, icon: 'device-tablet' },
		{ label: 'Ordinateur', width: 1280, icon: 'desktop' }
	];
	const defaultPanelWidth = 480;
	const smallestPanelWidth = 360;
	const largestPanelWidth = 760;
	let panelWidth = $state(defaultPanelWidth);
	let previewWidth = $state(1280);
	let previewZoom: ViewportZoom = $state('fit');
	let hasRestoredEditorLayout = $state(false);
	const editorLayoutStorageKey = 'crystal-pharm:site-editor-layout';

	// `editorView` est optionnel : les tailles gardées avant le mode immersif restent valables.
	type StoredEditorLayout = { panelWidth: number; previewWidth: number; previewZoom: ViewportZoom; editorView?: EditorView };

	function isStoredEditorLayout(value: unknown): value is StoredEditorLayout {
		if (typeof value !== 'object' || value === null) return false;
		const layout = value as Record<string, unknown>;
		return (
			typeof layout.panelWidth === 'number' &&
			typeof layout.previewWidth === 'number' &&
			(layout.previewZoom === 'fit' || typeof layout.previewZoom === 'number') &&
			(layout.editorView === undefined || layout.editorView === 'panels' || layout.editorView === 'immersive')
		);
	}

	function clampPanelWidth(width: number): number {
		return Math.round(Math.min(largestPanelWidth, Math.max(smallestPanelWidth, width)));
	}

	// Le stockage du navigateur peut être refusé (navigation privée) : l'éditeur garde alors ses tailles par défaut.
	onMount(() => {
		try {
			const storedLayout: unknown = JSON.parse(localStorage.getItem(editorLayoutStorageKey) ?? 'null');
			if (isStoredEditorLayout(storedLayout)) {
				panelWidth = clampPanelWidth(storedLayout.panelWidth);
				previewWidth = storedLayout.previewWidth;
				previewZoom = storedLayout.previewZoom;
				editorView = storedLayout.editorView ?? 'panels';
			}
		} catch {
			// Rien de gardé : les tailles par défaut conviennent.
		}
		hasRestoredEditorLayout = true;
	});

	$effect(() => {
		const editorLayout: StoredEditorLayout = { panelWidth, previewWidth, previewZoom, editorView };
		if (!hasRestoredEditorLayout) return;
		try {
			localStorage.setItem(editorLayoutStorageKey, JSON.stringify(editorLayout));
		} catch {
			// Le navigateur refuse de garder les tailles : elles valent pour cette visite seulement.
		}
	});

	const publicSiteHost = $derived(data.publicSiteUrl ? new URL(data.publicSiteUrl).host : undefined);
</script>

<svelte:window onhashchange={showBlockOfLocationHash} onkeydown={handleShortcuts} />
<UnsavedChangesGuard {hasUnsavedChanges} />

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

{#snippet panelHeader(blockId: EditorBlockId, description: string)}
	{@const moduleChoice = moduleChoiceOf(blockId)}
	<header class="grid gap-3 border-b border-line pb-4">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="flex min-w-0 items-center gap-3">
				<span class="grid size-11 flex-none place-items-center rounded-md bg-accent-soft text-accent-text">
					<Icon name={blockIcons[blockId]} size={22} />
				</span>
				<div class="min-w-0">
					<h2 class="title-2 text-ink">{titleOfBlock(blockId)}</h2>
					<p class="text-small text-ink-muted">{description}</p>
				</div>
			</div>
			{#if moduleChoice}{@render moduleSwitch(moduleChoice)}{/if}
		</div>
		{#if moduleChoice?.state.kind === 'unavailable'}
			<p class="flex items-start gap-2 rounded-md border border-warning/45 bg-warning-soft px-3 py-2 text-small text-ink">
				<Icon name="warning" size={18} class="mt-px flex-none text-warning" />
				<span>
					Pas encore sur le site : {moduleChoice.state.reason.charAt(0).toLowerCase()}{moduleChoice.state.reason.slice(1)}
					{#if moduleChoice.state.fixHref && !moduleChoice.state.fixHref.startsWith('#')}
						<TextLink href={moduleChoice.state.fixHref}>Y aller</TextLink>
					{/if}
				</span>
			</p>
		{/if}
	</header>
{/snippet}

{#snippet themePresetPicker()}
	<div class="grid gap-2">
		<p class="body-strong text-ink">Palettes du modèle</p>
		<p class="text-small text-ink-muted">Un point de départ : chaque couleur et chaque réglage reste modifiable ensuite.</p>
		<div class="flex flex-wrap gap-2">
			{#each themePresets as themePreset (themePreset.key)}
				<Button
					variant={matchingThemePreset?.key === themePreset.key ? 'primary' : 'secondary'}
					size="compact"
					onclick={() => (formValuesByLayoutId[layoutId] = applyThemePreset(chosenFormValues, themePreset))}>{themePreset.label}</Button
				>
			{/each}
		</div>
	</div>
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

{#snippet saveStatus()}
	{#if isSaving}
		Enregistrement…
	{:else if settingsErrorCount > 0}
		Corrigez les réglages signalés dans Style.
	{:else if hasIncompleteItem}
		Complétez ou retirez les lignes à moitié remplies.
	{:else if hasUnsavedChanges}
		<span class="inline-flex items-center gap-1.5 font-semibold text-ink">
			<span aria-hidden="true" class="size-2 rounded-full bg-warning"></span>Modifications non enregistrées
		</span>
	{:else if saveOutcome === 'saved'}
		<span class="inline-flex items-center gap-1.5">
			<Icon name="check-circle" size={16} class="text-success" />
			Site enregistré.
			{#if !data.publicSiteUrl}<TextLink href={siteAddressPathname}>Choisir son adresse</TextLink>{/if}
		</span>
	{:else}
		Tout est enregistré
	{/if}
{/snippet}

{#snippet blockListItems(isAlwaysVertical: boolean)}
	{#each blockIds as blockId, blockIndex (blockId)}
		{#if blockIndex === 1 || blockId === 'display'}
			<li aria-hidden="true" class="mx-2.5 my-1 border-t border-line-soft {isAlwaysVertical ? '' : 'max-lg:hidden'}"></li>
		{/if}
		<li class={isAlwaysVertical ? '' : 'max-lg:w-52 max-lg:flex-none'}>
			<EditorBlockRow
				icon={blockIcons[blockId]}
				title={titleOfBlock(blockId)}
				summary={summarizeBlock(blockId)}
				isSelected={selectedBlockId === blockId}
				status={statusOfBlock(blockId)}
				onselect={() => selectBlock(blockId)}
			/>
		</li>
	{/each}
{/snippet}

{#snippet blockPanels()}
	<div class="grid content-start gap-5 p-4 sm:p-6">
		{#if saveOutcome === 'failed' && failure?.formError}
			<Alert tone="danger" title="Le site n’a pas été enregistré">{failure.formError}</Alert>
		{/if}
		{#if unavailableMandatoryModuleTitles.length > 0}
			<Alert tone="warning" title="Modules imposés par votre groupement, encore masqués">
				{unavailableMandatoryModuleTitles.join(', ')} : il leur manque des informations pour s’afficher.
			</Alert>
		{/if}

		<div class="grid content-start gap-5 {selectedBlockId === 'appearance' ? '' : 'hidden'}">
			{@render panelHeader('appearance', 'La mise en page, les couleurs et les polices.')}
			<ChoiceGroup name="layoutId" legend="Mise en page" options={layoutOptions} layout="cards" bind:value={layoutId} />
			{#if themePresets.length > 0}
				{@render themePresetPicker()}
			{/if}
			{#if chosenManifest && themeSettingsFields.length > 0}
				{@render layoutSettingsFields('Couleurs, polices et angles', themeSettingsFields)}
			{/if}
			{#if contrastWarnings.length > 0}
				<Alert tone="warning" title="Certaines couleurs risquent d’être difficiles à lire">
					<ul class="grid gap-1">
						{#each contrastWarnings as contrastWarning (contrastWarning.label)}
							<li>{contrastWarning.label} : contraste {contrastWarning.contrastRatio.toFixed(1)} sur 4,5 recommandé.</li>
						{/each}
					</ul>
					Vous pouvez enregistrer quand même.
				</Alert>
			{/if}
			{#if chosenManifest && otherSettingsFields.length > 0}
				{@render layoutSettingsFields('Autres réglages', otherSettingsFields)}
			{/if}
		</div>

		<div class="grid content-start gap-5 {selectedBlockId === 'hero' ? '' : 'hidden'}">
			{@render panelHeader('hero', 'L’accroche et l’image qui ouvrent votre site.')}
			<HeroEditor {layoutId} bind:hero={sections.hero} bind:uploadedImagePreviewUrls />
		</div>

		<div class="grid content-start gap-5 {selectedBlockId === 'findUs' ? '' : 'hidden'}">
			{@render panelHeader('findUs', 'Les informations pour venir à la pharmacie.')}
			<FindUsEditor bind:findUs={sections.findUs} />
		</div>

		{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
			<div class="grid content-start gap-5 {selectedBlockId === moduleChoice.moduleName ? '' : 'hidden'}">
				{@render panelHeader(moduleChoice.moduleName, moduleChoice.description)}
				{#if moduleChoice.moduleName === 'services'}
					<ServiceListEditor {layoutId} bind:services bind:uploadedImagePreviewUrls onserviceadded={() => enableModule('services')} />
				{:else if moduleChoice.moduleName === 'news'}
					{#if data.base.group}
						<NewsSourceChooser group={data.base.group} bind:newsSource onchange={showGroupNewsWhenAvailable} />
					{/if}
					{#if displayedNewsSource === 'group' && data.base.group}
						<GroupArticleList groupName={data.base.group.name} articles={data.base.group.articles} />
					{:else}
						<ArticleListEditor {layoutId} bind:articles bind:uploadedImagePreviewUrls onarticleadded={() => enableModule('news')} />
					{/if}
				{:else if moduleChoice.moduleName === 'brands'}
					<BrandListEditor {layoutId} bind:brands bind:uploadedImagePreviewUrls onbrandadded={() => enableModule('brands')} />
				{:else if moduleChoice.moduleName === 'appointment'}
					<AppointmentEditor bind:appointment={sections.appointment} />
				{:else if moduleChoice.moduleName === 'onlineOrder'}
					<OnlineOrderEditor bind:onlineOrder={sections.onlineOrder} />
				{:else if !modulesWithOwnEditor.includes(moduleChoice.moduleName) && moduleChoice.state.kind !== 'unavailable'}
					<p class="text-small text-ink-muted">Rien à saisir ici : ce bloc reprend des informations déjà connues.</p>
				{/if}
			</div>
		{/each}

		<div class="grid content-start gap-5 {selectedBlockId === 'display' ? '' : 'hidden'}">
			{@render panelHeader('display', 'Les blocs que votre site montre, et leur ordre.')}
			<div class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
				{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
					<div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
						<button
							type="button"
							class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
							onclick={() => selectBlock(moduleChoice.moduleName)}
						>
							<Icon name={blockIcons[moduleChoice.moduleName]} size={18} class="flex-none text-ink-muted" />
							<span class="min-w-0">
								<span class="block body-strong text-ink underline-offset-3 hover:underline">{moduleChoice.title}</span>
								{#if moduleChoice.state.kind === 'unavailable'}
									<span class="block text-small text-ink-muted">{moduleChoice.state.reason}</span>
								{/if}
							</span>
						</button>
						{@render moduleSwitch(moduleChoice)}
					</div>
				{/each}
			</div>
			<div class="grid gap-2">
				<p class="body-strong text-ink">Ordre des blocs</p>
				<p class="text-small text-ink-muted">Seuls les blocs activés que ce modèle place dans la page d’accueil sont listés. L’en-tête, la garde, les horaires et « Nous trouver » gardent leur place.</p>
				<ModuleOrderList bind:moduleOrder {enabledModules} orderableModules={chosenManifest?.orderableModules} titleOf={(moduleName) => moduleTitles[moduleName] ?? moduleName} />
			</div>
		</div>

		<nav aria-label="Bloc précédent ou suivant" class="flex items-center justify-between gap-3 border-t border-line pt-4">
			{#if neighbourBlocks.previous}
				{@const previousBlockId = neighbourBlocks.previous}
				<Button variant="ghost" icon="caret-left" onclick={() => selectBlock(previousBlockId)}>{titleOfBlock(previousBlockId)}</Button>
			{:else}
				<span></span>
			{/if}
			{#if neighbourBlocks.next}
				{@const nextBlockId = neighbourBlocks.next}
				<span title="Alt + ↓" class="contents">
					<Button variant="secondary" onclick={() => selectBlock(nextBlockId)}>
						{titleOfBlock(nextBlockId)}<Icon name="caret-right" size={18} />
					</Button>
				</span>
			{/if}
		</nav>
	</div>
{/snippet}

{#snippet previewViewport(showsToolbar: boolean)}
	<ResizableViewport label="Aperçu du site" presets={viewportPresets} bind:width={previewWidth} bind:zoom={previewZoom} {showsToolbar}>
		<SitePreviewFrame frameUrl={data.preview.frameUrl} frameOrigin={data.preview.frameOrigin} tenantSite={previewedSite} />
	</ResizableViewport>
{/snippet}

{#snippet islandDivider()}
	<span aria-hidden="true" class="my-1 w-6 border-t border-line"></span>
{/snippet}

{#snippet islandButton(icon: IconName, label: string, isPressed: boolean, onclick: () => void)}
	<button
		type="button"
		aria-pressed={isPressed}
		aria-label={label}
		title={label}
		class="inline-grid size-control flex-none cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink aria-pressed:bg-accent-soft aria-pressed:text-accent-text"
		{onclick}
	>
		<Icon name={icon} size={20} />
	</button>
{/snippet}

{#snippet islandBar()}
	<a
		href={siteOverviewPathname}
		aria-label="Vue d’ensemble"
		title="Vue d’ensemble"
		class="inline-grid size-control flex-none place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
	>
		<Icon name="arrow-left" size={20} />
	</a>
	{@render islandDivider()}
	{@render islandButton('puzzle-piece', 'Les blocs du site', isIslandExpanded && islandSheet === 'blocks', () => toggleIslandSheet('blocks'))}
	{@render islandButton(
		blockIcons[selectedBlockId],
		`Modifier « ${titleOfBlock(selectedBlockId)} »`,
		isIslandExpanded && islandSheet === 'edition',
		() => toggleIslandSheet('edition')
	)}
	{@render islandDivider()}
	<div role="group" aria-label="Largeur de l’écran" class="flex flex-col items-center gap-1">
		{#each viewportPresets as preset (preset.width)}
			{@render islandButton(preset.icon, `${preset.label} · ${preset.width} px`, previewWidth === preset.width, () => showPreviewAt(preset.width))}
		{/each}
	</div>
	{@render islandDivider()}
	<p aria-live="polite" class="sr-only">{@render saveStatus()}</p>
	<span title="Enregistrer (Ctrl + S)" class="relative">
		<Button type="submit" icon="check" disabled={!canSave || !hasUnsavedChanges}><span class="sr-only">Enregistrer</span></Button>
		{#if hasUnsavedChanges}
			<span aria-hidden="true" class="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-warning"></span>
		{/if}
	</span>
	{@render islandButton('frame-corners', 'Quitter le mode immersif', false, () => (editorView = 'panels'))}
{/snippet}

{#snippet islandSheetContent()}
	<div class="flex flex-none items-center gap-2 px-3 pt-3 pb-1">
		{#if islandSheet === 'edition'}
			<Button variant="ghost" size="compact" icon="caret-left" onclick={() => (islandSheet = 'blocks')}>Tous les blocs</Button>
		{:else}
			<p class="px-1 text-eyebrow text-ink-muted">Blocs du site</p>
		{/if}
		<span class="ml-auto"><IconButton icon="x" label="Replier" onclick={() => (isIslandExpanded = false)} /></span>
	</div>
	<ol class="grid min-h-0 content-start gap-1 overflow-y-auto px-2 pb-2 {islandSheet === 'blocks' ? '' : 'hidden'}">
		{@render blockListItems(true)}
	</ol>
	<div bind:this={panelScroller} class="min-h-0 overflow-y-auto {islandSheet === 'edition' ? '' : 'hidden'}">
		{@render blockPanels()}
	</div>
{/snippet}

<!-- Le mode édition prend tout l'écran, au-dessus du menu de l'application : l'aperçu a besoin de la place. -->
<form
	bind:this={editionForm}
	method="POST"
	action="?/save"
	class="fixed inset-0 z-40 flex flex-col bg-app text-ink"
	use:enhance={saveWithoutReloading}
>
	<input type="hidden" name={servicesFieldName} value={JSON.stringify(services)} />
	<input type="hidden" name={articlesFieldName} value={JSON.stringify(articles)} />
	<input type="hidden" name={brandsFieldName} value={JSON.stringify(brands)} />
	<input type="hidden" name={sectionsFieldName} value={JSON.stringify(sections)} />
	{#each moduleOrder as orderedModuleName (orderedModuleName)}
		<input type="hidden" name={moduleOrderFieldName} value={orderedModuleName} />
	{/each}
	<input type="hidden" name={newsSourceFieldName} value={newsSource} />
	{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
		{#if moduleChoice.state.kind === 'optional' && enabledModules.includes(moduleChoice.moduleName)}
			<input type="hidden" name="enabledModules" value={moduleChoice.moduleName} />
		{/if}
	{/each}

	<!-- Les deux vues rendent les mêmes panneaux : passer de l'une à l'autre ne perd rien de ce qui est saisi. -->
	{#if editorView === 'immersive'}
		<div class="min-h-0 flex-1">
			{@render previewViewport(false)}
		</div>
		<FloatingIsland
			label="Édition du site"
			sheetLabel={islandSheet === 'blocks' ? 'Blocs du site' : titleOfBlock(selectedBlockId)}
			bind:isExpanded={isIslandExpanded}
		>
			{#snippet bar()}{@render islandBar()}{/snippet}
			{#snippet sheet()}{@render islandSheetContent()}{/snippet}
		</FloatingIsland>
	{:else}
		<header class="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
			<Button variant="ghost" icon="arrow-left" href={siteOverviewPathname}><span class="max-sm:sr-only">Vue d’ensemble</span></Button>
			<div class="min-w-0 border-l border-line pl-3">
				<p class="truncate body-strong text-ink">{data.isSiteCreated ? 'Modifier le site' : 'Créer le site'}</p>
				<p class="truncate text-label text-ink-muted">{publicSiteHost ?? 'Pas encore en ligne'}</p>
			</div>

			<div class="ml-auto lg:hidden">
				<SegmentedToggle label="Édition ou aperçu" options={mobileViewOptions} bind:value={mobileView} />
			</div>

			<p aria-live="polite" class="text-small text-ink-muted max-md:order-last max-md:w-full lg:ml-auto">{@render saveStatus()}</p>
			<div class="flex items-center gap-2">
				<span title="Le site en plein écran, l’édition dans un îlot flottant" class="contents">
					<Button variant="secondary" icon="frame-corners" onclick={() => (editorView = 'immersive')}><span class="max-xl:sr-only">Mode immersif</span></Button>
				</span>
				{#if data.publicSiteUrl}
					<Button variant="secondary" icon="arrow-square-out" href={data.publicSiteUrl} opensInNewTab><span class="max-xl:sr-only">Voir mon site</span></Button>
				{/if}
				<span title="Ctrl + S" class="contents">
					<Button type="submit" icon="check" disabled={!canSave || !hasUnsavedChanges}>Enregistrer</Button>
				</span>
			</div>
		</header>

		<div class="flex min-h-0 flex-1 max-lg:flex-col">
			<nav
				aria-label="Blocs du site"
				class="flex-none border-line bg-surface max-lg:border-b lg:w-64 lg:overflow-y-auto lg:border-r {mobileView === 'edition' ? '' : 'max-lg:hidden'}"
			>
				<ol class="flex gap-1 p-2 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] lg:flex-col">
					{@render blockListItems(false)}
				</ol>
			</nav>

			<div
				bind:this={panelScroller}
				class="min-h-0 overflow-y-auto max-lg:w-full! max-lg:flex-1 lg:flex-none {mobileView === 'edition' ? '' : 'max-lg:hidden'}"
				style:width="{panelWidth}px"
			>
				{@render blockPanels()}
			</div>

			<div class="flex-none max-lg:hidden">
				<ResizeHandle
					label="Élargir ou rétrécir le panneau d’édition"
					value={panelWidth}
					minimum={smallestPanelWidth}
					maximum={largestPanelWidth}
					onmove={(deltaInPixels) => (panelWidth = clampPanelWidth(panelWidth + deltaInPixels))}
					onreset={() => (panelWidth = defaultPanelWidth)}
				/>
			</div>

			<div class="min-h-0 min-w-0 flex-1 border-line lg:border-l {mobileView === 'apercu' ? '' : 'max-lg:hidden'}">
				{@render previewViewport(true)}
			</div>
		</div>
	{/if}
</form>
