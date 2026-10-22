<script lang="ts">
	import { signInAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, LoginForm, TextLink } from '@crystal-pharm/ui';
</script>

<AuthenticationScreen title="Connexion" subtitle="Espace gérant de votre pharmacie.">
	<LoginForm onSubmit={(credentials) => signInAndOpen(credentials, '/')} />

	{#snippet footer()}
		Pas encore de compte ? <TextLink href="/register">Créer un compte</TextLink>
	{/snippet}
</AuthenticationScreen>
