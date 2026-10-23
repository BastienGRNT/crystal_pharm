<script lang="ts">
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, Button } from '@crystal-pharm/ui';
	import { groupAuthenticationSpace } from '$lib/groupAuthenticationSpace';
</script>

<AuthenticationScreen
	space={groupAuthenticationSpace}
	title="Aucun groupement pour ce compte"
	subtitle="Votre compte n’est rattaché à aucun groupement. L’accès se fait sur invitation : suivez le lien reçu par email, ou demandez à votre groupement de vous inviter."
>
	<Button variant="secondary" icon="sign-out" isFullWidth onclick={() => signOutAndOpen('/login')}>Se déconnecter</Button>
</AuthenticationScreen>
