import { readDevelopmentOutbox } from '@crystal-pharm/email';
import { readAppUrl } from '../appUrls.server';
import { listDevelopmentActionGroups } from '../actions/developmentActions.server';
import { demoPersonas, findDemoPersonaByEmail, type DemoSpace } from '../personas/demoPersonas';

/** La forme attendue par `DeveloperToolbar` de `ui`. */
export type DeveloperToolbarData = {
	signedInLabel: string | undefined;
	accountGroups: { title: string; accounts: { label: string; description: string; href: string; isCurrent: boolean }[] }[];
	actionGroups: { title: string; actions: { actionName: string; label: string; description: string; isDestructive?: boolean }[] }[];
	emails: { to: string; subject: string; text: string; sentAt: string; links: { label: string; url: string }[] }[];
	actionPathname: string;
};

const accountGroupTitles: Record<DemoSpace, string> = {
	pharmacy: 'Pharmacies',
	group: 'Groupements',
	admin: 'Administration'
};

export const developmentActionPathname = '/__dev/actions';

export function personaSignInUrl(space: DemoSpace, personaKey: string): string {
	return `${readAppUrl(space)}/__dev/connexion/${personaKey}`;
}

export function loadDeveloperToolbarData({
	space,
	signedInEmail
}: {
	space: DemoSpace;
	signedInEmail: string | undefined;
}): DeveloperToolbarData {
	const signedInPersona = findDemoPersonaByEmail(signedInEmail);
	const spacesInDisplayOrder: DemoSpace[] = [space, ...(['pharmacy', 'group', 'admin'] as const).filter((candidate) => candidate !== space)];
	return {
		signedInLabel: signedInPersona?.label ?? signedInEmail,
		accountGroups: spacesInDisplayOrder.map((accountSpace) => ({
			title: accountSpace === space ? `${accountGroupTitles[accountSpace]} · ici` : accountGroupTitles[accountSpace],
			accounts: demoPersonas
				.filter((persona) => persona.space === accountSpace)
				.map((persona) => ({
					label: persona.label,
					description: persona.description,
					href: personaSignInUrl(accountSpace, persona.personaKey),
					isCurrent: persona.space === space && persona.email === signedInPersona?.email
				}))
		})),
		actionGroups: listDevelopmentActionGroups(space, signedInEmail !== undefined),
		emails: readDevelopmentOutbox().map((email) => ({
			to: email.to,
			subject: email.subject,
			text: email.text,
			sentAt: email.sentAt,
			links: [...email.actionLinks]
		})),
		actionPathname: developmentActionPathname
	};
}
