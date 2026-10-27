<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { keepAccessibleLinks } from '@crystal-pharm/home';
	import { Alert, AppShell } from '@crystal-pharm/ui';
	import { accountLinks, toolLinks } from '$lib/toolLinks';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
</script>

<AppShell
	navigationLinks={keepAccessibleLinks(toolLinks, data.accessibleToolKeys)}
	{accountLinks}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInManager}
	spaceLabel={data.pharmacyName}
	hrefsNeedingAttention={data.hrefsNeedingAttention}
	onSignOut={() => signOutAndOpen('/login')}
>
	{#if data.overduePayment}
		<Alert tone="warning" title="Paiement en retard">
			Vos modules restent actifs jusqu’au {dateFormatter.format(data.overduePayment.modulesCloseAt)}. Régularisez-le depuis
			<a class="underline" href="/abonnement">votre abonnement</a>.
		</Alert>
	{/if}
	{@render children()}
</AppShell>
