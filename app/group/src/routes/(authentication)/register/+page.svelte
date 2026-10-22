<script lang="ts">
	import { registerAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, RegisterForm, TextLink } from '@crystal-pharm/ui';
	import { groupAuthenticationSpace } from '$lib/groupAuthenticationSpace';
</script>

<AuthenticationScreen space={groupAuthenticationSpace} title="Créer un compte" subtitle="Accédez au tableau de bord de votre groupement.">
	<RegisterForm onSubmit={(newAccount) => registerAndOpen(newAccount, '/')} />

	{#snippet footer()}
		Déjà un compte ? <TextLink href="/login">Se connecter</TextLink>
	{/snippet}
</AuthenticationScreen>
