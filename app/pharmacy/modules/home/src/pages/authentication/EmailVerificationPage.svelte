<script lang="ts">
	import { page } from '$app/state';
	import { readReturnPathname, resendVerificationCode, verifyEmailAndOpen, verificationCodeLength } from '@crystal-pharm/auth/client';
	import { AuthenticationScreen, EmailVerificationForm, TextLink } from '@crystal-pharm/ui';
	import { homePathnames } from '../../homePathnames';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';

	const email = $derived(page.url.searchParams.get('email') ?? '');
	const destinationPathname = $derived(readReturnPathname(page.url, homePathnames.toolsHome));
</script>

<AuthenticationScreen
	space={pharmacyAuthenticationSpace}
	title="Confirmez votre email"
	subtitle={email ? `Nous venons d’envoyer un code à ${email}. Il est valable 10 minutes.` : 'Saisissez le code reçu par email.'}
>
	<EmailVerificationForm
		codeLength={verificationCodeLength}
		onSubmit={({ code }) => verifyEmailAndOpen({ email, code }, destinationPathname)}
		onResend={() => resendVerificationCode(email)}
	/>

	{#snippet footer()}
		Mauvaise adresse ? <TextLink href="/register">Recommencer l’inscription</TextLink>
	{/snippet}
</AuthenticationScreen>
