<script lang="ts">
	import { page } from '$app/state';
	import { readReturnPathname, signInAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, LoginForm, TextLink } from '@crystal-pharm/ui';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';
</script>

<AuthenticationScreen space={pharmacyAuthenticationSpace} title="Connexion" subtitle="Avec l’email (ou l’identifiant du comptoir) et le mot de passe de votre compte.">
	<LoginForm acceptsUsername onSubmit={(credentials) => signInAndOpen(credentials, readReturnPathname(page.url, '/'))} />

	{#snippet footer()}
		Pas encore de compte ? <TextLink href="/register">Créer un compte</TextLink>
	{/snippet}
</AuthenticationScreen>
