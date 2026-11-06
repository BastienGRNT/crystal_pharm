import { readDevelopmentOutbox } from '@crystal-pharm/email';
import { readAppUrl } from '../appUrls.server';
import { listDevelopmentActionGroups } from '../actions/developmentActions.server';
import { takeDevelopmentNotice, type DevelopmentNotice, type DevelopmentNoticeCookies } from '../actions/developmentNotice.server';
import {
	demoCounterAccounts,
	demoPersonas,
	findDemoCounterAccountByUsername,
	findDemoPersonaByEmail,
	type DemoSpace
} from '../personas/demoPersonas';
import { loadDeveloperToolbarContext, type DeveloperToolbarContext } from './developerToolbarContext.server';

type DeveloperToolbarActionGroup = {
	title: string;
	actions: { actionName: string; label: string; description: string; isDestructive?: boolean }[];
};

/** La forme attendue par `DeveloperToolbar` de `ui`. */
export type DeveloperToolbarData = {
	signedInLabel: string | undefined;
	currentContext: DeveloperToolbarContext | undefined;
	accountGroups: {
		title: string;
		accounts: { label: string; description: string; badges: string[]; href: string; isCurrent: boolean }[];
	}[];
	accountActionGroups: DeveloperToolbarActionGroup[];
	globalActionGroups: DeveloperToolbarActionGroup[];
	emails: { to: string; subject: string; text: string; sentAt: string; links: { label: string; url: string }[] }[];
	notice: DevelopmentNotice | undefined;
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

export async function loadDeveloperToolbarData({
	space,
	signedInAccountId,
	signedInEmail,
	signedInUsername,
	cookies
}: {
	space: DemoSpace;
	signedInAccountId: string | undefined;
	signedInEmail: string | undefined;
	/** Le CounterAccount n'a pas d'email à reconnaître : son identifiant. */
	signedInUsername?: string | undefined;
	cookies: DevelopmentNoticeCookies;
}): Promise<DeveloperToolbarData> {
	const signedInPersona = findDemoPersonaByEmail(signedInEmail);
	const signedInCounterAccount = findDemoCounterAccountByUsername(signedInUsername);
	const [{ accountActionGroups, globalActionGroups }, currentContext, sentEmails] = await Promise.all([
		listDevelopmentActionGroups(space, signedInAccountId),
		loadDeveloperToolbarContext(space, signedInAccountId),
		readDevelopmentOutbox()
	]);
	return {
		signedInLabel: signedInPersona?.label ?? signedInCounterAccount?.label ?? signedInEmail ?? signedInUsername,
		currentContext,
		accountGroups: listAccountGroups(space, [signedInPersona?.personaKey, signedInCounterAccount?.personaKey]),
		accountActionGroups,
		globalActionGroups,
		emails: sentEmails.map((email) => ({
			to: email.to,
			subject: email.subject,
			text: email.text,
			sentAt: email.sentAt,
			links: [...email.actionLinks]
		})),
		notice: takeDevelopmentNotice(cookies),
		actionPathname: developmentActionPathname
	};
}

/** Les comptes de l'app en cours d'abord : ce sont ceux qu'on veut le plus souvent. */
function listAccountGroups(space: DemoSpace, signedInPersonaKeys: readonly (string | undefined)[]): DeveloperToolbarAccountGroup[] {
	const spacesInDisplayOrder: DemoSpace[] = [space, ...(['pharmacy', 'group', 'admin'] as const).filter((candidate) => candidate !== space)];
	const toAccount = (
		accountSpace: DemoSpace,
		persona: { personaKey: string; label: string; description: string; badges: readonly string[] }
	): DeveloperToolbarAccount => ({
		label: persona.label,
		description: persona.description,
		badges: [...persona.badges],
		href: personaSignInUrl(accountSpace, persona.personaKey),
		isCurrent: accountSpace === space && signedInPersonaKeys.includes(persona.personaKey)
	});
	return spacesInDisplayOrder.flatMap((accountSpace): DeveloperToolbarAccountGroup[] => {
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
	});
}
