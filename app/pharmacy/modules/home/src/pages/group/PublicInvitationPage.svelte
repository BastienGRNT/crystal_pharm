<script lang="ts">
	import { registerAndOpen, signInAndOpen } from '@crystal-pharm/auth/client';
	import { Alert, AuthenticationScreen, Button, LoginForm, RegisterForm, TextLink } from '@crystal-pharm/ui';
	import { homePathnames } from '../../homePathnames';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';
	import type { PublicInvitationPageData } from './groupInvitationPageData';

	let { data }: { data: PublicInvitationPageData } = $props();

	const invitationPathname = $derived(`/invitation/${data.invitationToken}`);
	const unavailableMessages = {
		expired: 'Cette invitation a expiré. Demandez à votre groupement de vous en renvoyer une.',
		accepted: 'Cette invitation a déjà été acceptée. Connectez-vous pour retrouver votre pharmacie.',
		declined: 'Cette invitation a été refusée.',
		revoked: 'Le groupement a annulé cette invitation.'
	} as const;
</script>

<AuthenticationScreen
	space={pharmacyAuthenticationSpace}
	title="{data.groupName} vous invite"
	subtitle="Rejoignez son groupement sur Crystal Pharm. Vous verrez ce qu’il prend en charge avant d’accepter."
>
	{#if data.status !== 'pending'}
		<Alert tone="warning">{unavailableMessages[data.status]}</Alert>
		<Button href={homePathnames.login} variant="secondary" isFullWidth>Se connecter</Button>
	{:else if data.visitorSituation === 'needs-pharmacy'}
		<p class="text-body text-ink-muted">Présentez d’abord votre pharmacie : l’invitation vous attendra ensuite sur l’accueil.</p>
		<Button href={homePathnames.contactDetailsStep} icon="storefront" isFullWidth>Présenter ma pharmacie</Button>
	{:else if data.visitorSituation === 'has-account'}
		<p class="text-body text-ink-muted">Un compte existe déjà pour {data.invitedEmail} : connectez-vous pour voir l’invitation.</p>
		<LoginForm initialEmail={data.invitedEmail} isEmailLocked onSubmit={(credentials) => signInAndOpen(credentials, invitationPathname)} />
	{:else}
		<p class="text-body text-ink-muted">Créez votre compte, puis présentez votre pharmacie : l’invitation vous attendra sur l’accueil.</p>
		<RegisterForm
			initialEmail={data.invitedEmail}
			isEmailLocked
			onSubmit={(newAccount) => registerAndOpen(newAccount, homePathnames.contactDetailsStep)}
		/>
	{/if}

	{#snippet footer()}
		{#if data.status === 'pending' && data.visitorSituation === 'needs-account'}
			Déjà un compte ? <TextLink href="{homePathnames.login}?redirectTo={invitationPathname}">Se connecter</TextLink>
		{/if}
	{/snippet}
</AuthenticationScreen>
