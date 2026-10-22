<script lang="ts">
	import { signInAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, LoginForm, TextLink } from '@crystal-pharm/ui';
	import { groupAuthenticationSpace } from '$lib/groupAuthenticationSpace';
</script>

<AuthenticationScreen space={groupAuthenticationSpace} title="Connexion" subtitle="Avec l’email et le mot de passe de votre compte.">
	<LoginForm onSubmit={(credentials) => signInAndOpen(credentials, '/')} />

	{#snippet footer()}
		Pas encore de compte ? <TextLink href="/register">Créer un compte</TextLink>
	{/snippet}
</AuthenticationScreen>
