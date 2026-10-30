import { readDevelopmentOutbox } from '@crystal-pharm/email';
import { readAppUrl } from '../appUrls.server';
import { listDevelopmentActionGroups } from '../actions/developmentActions.server';
import {
	demoCounterAccounts,
	demoPersonas,
	findDemoCounterAccountByUsername,
	findDemoPersonaByEmail,
	type DemoSpace
} from '../personas/demoPersonas';

/** La forme attendue par `DeveloperToolbar` de `ui`. */
export type DeveloperToolbarData = {
	signedInLabel: string | undefined;
	accountGroups: { title: string; accounts: { label: string; description: string; href: string; isCurrent: boolean }[] }[];
	actionGroups: { title: string; actions: { actionName: string; label: string; description: string; isDestructive?: boolean }[] }[];
	emails: { to: string; subject: string; text: string; sentAt: string; links: { label: string; url: string }[] }[];
	actionPathname: string;
};

type DeveloperToolbarAccountGroup = DeveloperToolbarData['accountGroups'][number];
type DeveloperToolbarAccount = DeveloperToolbarAccountGroup['accounts'][number];

const pharmacyTeamGroupTitle = 'Pharmacies · comptes de l’équipe';

const accountGroupTitles: Record<DemoSpace, string> = {
	pharmacy: 'Pharmacies',
	group: 'Groupements',
	admin: 'Administration'
};

const developmentActionPathname = '/__dev/actions';

function personaSignInUrl(space: DemoSpace, personaKey: string): string {
	return `${readAppUrl(space)}/__dev/connexion/${personaKey}`;
}

export function loadDeveloperToolbarData({
	space,
	signedInEmail,
	signedInUsername
}: {
	space: DemoSpace;
	signedInEmail: string | undefined;
	/** Le CounterAccount n'a pas d'email à reconnaître : son identifiant. */
	signedInUsername?: string | undefined;
}): DeveloperToolbarData {
	const signedInPersona = findDemoPersonaByEmail(signedInEmail);
	const signedInCounterAccount = findDemoCounterAccountByUsername(signedInUsername);
	const spacesInDisplayOrder: DemoSpace[] = [space, ...(['pharmacy', 'group', 'admin'] as const).filter((candidate) => candidate !== space)];
	const isSignedInHere = (accountSpace: DemoSpace, personaKey: string) =>
		accountSpace === space && (personaKey === signedInPersona?.personaKey || personaKey === signedInCounterAccount?.personaKey);
	const toAccount = (accountSpace: DemoSpace, persona: { personaKey: string; label: string; description: string }): DeveloperToolbarAccount => ({
		label: persona.label,
		description: persona.description,
		href: personaSignInUrl(accountSpace, persona.personaKey),
		isCurrent: isSignedInHere(accountSpace, persona.personaKey)
	});
	return {
		signedInLabel: signedInPersona?.label ?? signedInCounterAccount?.label ?? signedInEmail,
		accountGroups: spacesInDisplayOrder.flatMap((accountSpace): DeveloperToolbarAccountGroup[] => {
			const title = accountSpace === space ? `${accountGroupTitles[accountSpace]} · ici` : accountGroupTitles[accountSpace];
			const spacePersonas = demoPersonas.filter((persona) => persona.space === accountSpace);
			const accountGroup = { title, accounts: spacePersonas.filter((persona) => !persona.teamRole).map((persona) => toAccount(accountSpace, persona)) };
			if (accountSpace !== 'pharmacy') return [accountGroup];
			// Un compte par rôle dans l'équipe d'une pharmacie : à part, pour ne pas noyer les parcours des pharmacies.
			const teamGroup = {
				title: pharmacyTeamGroupTitle,
				accounts: [
					...spacePersonas.filter((persona) => persona.teamRole).map((persona) => toAccount(accountSpace, persona)),
					...demoCounterAccounts.map((counterAccount) => toAccount(accountSpace, counterAccount))
				]
			};
			return [accountGroup, teamGroup];
		}),
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
