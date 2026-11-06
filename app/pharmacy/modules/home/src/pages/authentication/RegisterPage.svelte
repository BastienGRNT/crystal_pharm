<script lang="ts">
	import { passwordRequirements } from '@crystal-pharm/auth/account-rules';
	import { registerAndOpen } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, RegisterForm, TextLink } from '@crystal-pharm/ui';
	import { homePathnames } from '../../homePathnames';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';
</script>

<AuthenticationScreen space={pharmacyAuthenticationSpace} title="Créez votre compte de titulaire" subtitle="C’est votre compte personnel : vous ajouterez votre pharmacie juste après. Un membre de l’équipe crée le sien depuis son email d’invitation.">
	<RegisterForm {passwordRequirements} onSubmit={(newAccount) => registerAndOpen(newAccount, homePathnames.contactDetailsStep)} />

	{#snippet footer()}
		Déjà un compte ? <TextLink href="/login">Se connecter</TextLink>
	{/snippet}
</AuthenticationScreen>
