<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Field, PageHeader, TextLink, UnitInput } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { subdomainFieldName, type SiteAddressChanged, type SiteAddressFailure, type SiteAddressPageData } from './siteAddressPageData';

	type SiteAddressPageProps = {
		data: SiteAddressPageData;
		form: SiteAddressFailure | SiteAddressChanged | null | undefined;
	};

	let { data, form }: SiteAddressPageProps = $props();

	const failure = $derived(form && 'errorMessage' in form ? form : undefined);
	let subdomain = $state(untrack(() => failure?.submittedSubdomain ?? data.proposedSubdomain));
</script>

<div class="grid gap-6">
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

	<Card>
		<form method="POST" use:enhance class="grid gap-4">
			<Field
				label="Adresse"
				hint="Lettres sans accent, chiffres et tirets. L’ancienne adresse continue de mener à votre site."
				errorMessage={failure?.errorMessage}
			>
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
			<div>
				<Button type="submit" disabled={subdomain === data.currentSubdomain}>Enregistrer l’adresse</Button>
			</div>
		</form>
	</Card>
</div>
