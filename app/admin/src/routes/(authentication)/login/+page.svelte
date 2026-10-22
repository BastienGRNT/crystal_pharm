<script lang="ts">
	import { signInAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, LoginForm, TextLink } from '@crystal-pharm/ui';
	import { adminAuthenticationSpace } from '$lib/adminAuthenticationSpace';
</script>

<AuthenticationScreen space={adminAuthenticationSpace} title="Connexion" subtitle="Avec l’email et le mot de passe de votre compte.">
	<LoginForm onSubmit={(credentials) => signInAndOpen(credentials, '/')} />

	{#snippet footer()}
		Pas encore de compte ? <TextLink href="/register">Créer un compte</TextLink>
	{/snippet}
</AuthenticationScreen>
