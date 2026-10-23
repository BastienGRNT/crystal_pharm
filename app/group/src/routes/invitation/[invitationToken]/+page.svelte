<script lang="ts">
	import { page } from '$app/state';
	import { registerAndOpen, signInAndOpen, signOutAndOpen } from '@crystal-pharm/auth/client';
	import type { InvitationStatus } from '@crystal-pharm/group-db/domain';
	import { Alert, AuthenticationScreen, Button, LoginForm, RegisterForm, TextLink } from '@crystal-pharm/ui';
	import { groupAuthenticationSpace } from '$lib/groupAuthenticationSpace';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const invitationPathname = $derived(page.url.pathname);
	const unavailableMessages: Record<Exclude<InvitationStatus, 'pending'>, string> = {
		expired: 'Cette invitation a expiré. Demandez à Crystal Pharm ou à votre groupement de vous en renvoyer une.',
		accepted: 'Cette invitation a déjà été utilisée. Connectez-vous pour accéder à votre espace.',
		declined: 'Cette invitation a été refusée.',
		revoked: 'Cette invitation a été annulée.'
	};
</script>

<AuthenticationScreen
	space={groupAuthenticationSpace}
	title="Rejoignez {data.invitation.groupName}"
	subtitle="Votre espace pour inviter vos pharmacies et suivre ce que vous prenez en charge."
>
	{#if data.invitation.status !== 'pending'}
		<Alert tone="warning">{unavailableMessages[data.invitation.status]}</Alert>
		<Button href="/login" variant="secondary" isFullWidth>Se connecter</Button>
	{:else if data.visitorSituation === 'signed-in-as-invited'}
		<form method="POST" class="grid gap-3">
			<p class="text-body text-ink-muted">Vous êtes connecté avec {data.signedInEmail}.</p>
			{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}
			<Button type="submit" icon="sign-in" isFullWidth>Rejoindre l’espace {data.invitation.groupName}</Button>
		</form>
	{:else if data.visitorSituation === 'signed-in-as-someone-else'}
		<Alert tone="warning" title="Ce n’est pas le bon compte">
			Vous êtes connecté avec {data.signedInEmail}, mais cette invitation est pour {data.invitation.email}.
		</Alert>
		<Button variant="secondary" icon="sign-out" isFullWidth onclick={() => signOutAndOpen(invitationPathname)}>
			Se déconnecter et continuer
		</Button>
	{:else if data.visitorSituation === 'has-account'}
		<p class="text-body text-ink-muted">Un compte existe déjà pour {data.invitation.email} : connectez-vous pour rejoindre le groupement.</p>
		<LoginForm initialEmail={data.invitation.email} isEmailLocked onSubmit={(credentials) => signInAndOpen(credentials, invitationPathname)} />
	{:else}
		<RegisterForm
			initialEmail={data.invitation.email}
			isEmailLocked
			onSubmit={(newAccount) => registerAndOpen(newAccount, invitationPathname)}
		/>
	{/if}

	{#snippet footer()}
		{#if data.invitation.status === 'pending' && data.visitorSituation === 'needs-account'}
			Déjà un compte ? <TextLink href="/login?redirectTo={invitationPathname}">Se connecter</TextLink>
		{/if}
	{/snippet}
</AuthenticationScreen>
