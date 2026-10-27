<script lang="ts">
	import { registerAndOpen, signInAndOpen, signOutAndOpen } from '@crystal-pharm/auth/client';
	import { Alert, AuthenticationScreen, Button, LoginForm, RegisterForm, TextLink } from '@crystal-pharm/ui';
	import { homePathnames, teamInvitationPathname } from '../../homePathnames';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';
	import type { TeamInvitationFailure, TeamInvitationPageData } from './teamInvitationPageData';

	type TeamInvitationPageProps = {
		data: TeamInvitationPageData;
		form: TeamInvitationFailure | null | undefined;
	};

	let { data, form }: TeamInvitationPageProps = $props();

	const invitationPathname = $derived(teamInvitationPathname(data.invitationToken));
</script>

<AuthenticationScreen
	space={pharmacyAuthenticationSpace}
	title="Rejoignez {data.pharmacyName}"
	subtitle="Bonjour {data.employeeFirstName}, créez votre compte pour accéder aux outils de la pharmacie."
>
	{#if data.unavailableMessage}
		<Alert tone="warning">{data.unavailableMessage}</Alert>
		<Button href={homePathnames.login} variant="secondary" isFullWidth>Se connecter</Button>
	{:else if data.visitorSituation === 'signed-in-as-invited'}
		<form method="POST" class="grid gap-3">
			<p class="text-body text-ink-muted">Vous êtes connecté avec {data.signedInEmail}.</p>
			{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}
			<Button type="submit" icon="sign-in" isFullWidth>Rejoindre {data.pharmacyName}</Button>
		</form>
	{:else if data.visitorSituation === 'signed-in-as-someone-else'}
		<Alert tone="warning" title="Ce n’est pas le bon compte">
			Vous êtes connecté avec {data.signedInEmail}, mais cette invitation est pour {data.invitedEmail}.
		</Alert>
		<Button variant="secondary" icon="sign-out" isFullWidth onclick={() => signOutAndOpen(invitationPathname)}>
			Se déconnecter et continuer
		</Button>
	{:else if data.visitorSituation === 'has-account'}
		<p class="text-body text-ink-muted">Un compte existe déjà pour {data.invitedEmail} : connectez-vous pour rejoindre la pharmacie.</p>
		<LoginForm initialEmail={data.invitedEmail} isEmailLocked onSubmit={(credentials) => signInAndOpen(credentials, invitationPathname)} />
	{:else}
		<RegisterForm
			initialEmail={data.invitedEmail}
			isEmailLocked
			onSubmit={(newAccount) => registerAndOpen(newAccount, invitationPathname)}
		/>
	{/if}

	{#snippet footer()}
		{#if !data.unavailableMessage && data.visitorSituation === 'needs-account'}
			Déjà un compte ? <TextLink href="{homePathnames.login}?redirectTo={invitationPathname}">Se connecter</TextLink>
		{/if}
	{/snippet}
</AuthenticationScreen>
