<script lang="ts">
	import { registerAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, RegisterForm, TextLink } from '@crystal-pharm/ui';
</script>

<AuthenticationScreen title="Créer un compte" subtitle="Accédez aux outils de votre pharmacie.">
	<RegisterForm onSubmit={(newAccount) => registerAndOpen(newAccount, '/')} />

	{#snippet footer()}
		Déjà un compte ? <TextLink href="/login">Se connecter</TextLink>
	{/snippet}
</AuthenticationScreen>
