<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Field, FormSection, Icon, PageHeader, TextLink, UnitInput } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { subdomainFieldName, type SiteAddressChanged, type SiteAddressFailure, type SiteAddressPageData } from './siteAddressPageData';

	type SiteAddressPageProps = {
		data: SiteAddressPageData;
		form: SiteAddressFailure | SiteAddressChanged | null | undefined;
	};

	let { data, form }: SiteAddressPageProps = $props();

	const failure = $derived(form && 'errorMessage' in form ? form : undefined);
	let subdomain = $state(untrack(() => failure?.submittedSubdomain ?? data.proposedSubdomain));
	const previewedSubdomain = $derived(subdomain.trim() === '' ? '…' : subdomain.trim().toLowerCase());
</script>

<div class="grid gap-8">
	<PageHeader title="Adresse de mon site" context="Là où vos visiteurs trouvent votre site" icon="globe-simple">
		{#snippet actions()}
			<Button variant="ghost" href="/site-manager">Retour au site</Button>
		{/snippet}
	</PageHeader>

	{#if form && 'isChanged' in form && data.publicSiteUrl}
		<Alert tone="success" title="Adresse enregistrée">
			Votre site est maintenant à <TextLink href={data.publicSiteUrl} opensInNewTab>{data.publicSiteUrl}</TextLink>.
		</Alert>
	{/if}

	<FormSection title="Votre adresse" description="Lettres sans accent, chiffres et tirets. L’ancienne adresse continue de mener à votre site.">
		<form method="POST" use:enhance class="grid gap-5">
			<!-- La barre d'adresse telle que le patient la tapera : on voit le résultat avant d'enregistrer. -->
			<div class="grid gap-2 rounded-lg bg-rail p-4 text-on-rail" aria-hidden="true">
				<span class="text-eyebrow text-rail-ink">Vos patients taperont</span>
				<p class="flex min-w-0 items-center gap-2 rounded-md bg-rail-raised px-3 py-2">
					<Icon name="lock-simple" />
					<span class="truncate font-display text-[20px] leading-7">
						<span class="text-accent-on-rail">{previewedSubdomain}</span><span class="text-rail-ink">{data.addressSuffix}</span>
					</span>
				</p>
			</div>

			<Field label="Le début de l’adresse" errorMessage={failure?.errorMessage}>
				{#snippet control(controlAttributes)}
					<UnitInput
						{...controlAttributes}
						name={subdomainFieldName}
						unit={data.addressSuffix}
						autocomplete="off"
						autocapitalize="none"
						spellcheck={false}
						maxlength={63}
						required
						bind:value={subdomain}
					/>
				{/snippet}
			</Field>

			<div class="flex flex-wrap items-center gap-3 border-t border-dashed border-line-strong/50 pt-4">
				<Button type="submit" disabled={subdomain === data.currentSubdomain}>Enregistrer l’adresse</Button>
				{#if data.publicSiteUrl}
					<TextLink href={data.publicSiteUrl} opensInNewTab>Voir le site actuel</TextLink>
				{/if}
			</div>
		</form>
	</FormSection>
</div>
