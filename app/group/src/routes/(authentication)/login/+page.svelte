<script lang="ts">
	import { page } from '$app/state';
	import { readReturnPathname, signInAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, LoginForm } from '@crystal-pharm/ui';
	import { groupAuthenticationSpace } from '$lib/groupAuthenticationSpace';
</script>

<AuthenticationScreen space={groupAuthenticationSpace} title="Connexion" subtitle="Avec l’email et le mot de passe de votre compte.">
	<LoginForm onSubmit={(credentials) => signInAndOpen(credentials, readReturnPathname(page.url, '/'))} />

	{#snippet footer()}
		Pas encore de compte ? L’accès à l’espace groupement se fait sur invitation : suivez le lien reçu par email.
	{/snippet}
</AuthenticationScreen>
