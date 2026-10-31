import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';
import { chooseDisplayedNewsSource } from '@crystal-pharm/group-db/domain';
import { collectAvailableModuleData, type SiteContentDraft, type SiteEditorBase } from './siteDraft';

/** Un module tel que le Manager le voit : il peut l'afficher, il lui est imposé, ou il lui manque quelque chose. */
export type SiteModuleChoice = {
	moduleName: ModuleName;
	title: string;
	description: string;
	state:
		| { kind: 'optional' }
		| { kind: 'mandatory'; groupName: string }
		| { kind: 'unavailable'; reason: string; fixHref: string | undefined };
};

type ModuleTexts = { title: string; description: string; unavailableReason: string; fixHref?: string };

const moduleTexts: Record<ModuleName, ModuleTexts> = {
	team: {
		title: 'L’équipe',
		description: 'Les membres de votre équipe, avec leur photo et leur fonction.',
		unavailableReason: 'Ajoutez d’abord les membres de votre équipe.',
		fixHref: '/pharmacie?onglet=equipe'
	},
	services: {
		title: 'Services',
		description: 'Les services que propose la pharmacie.',
		unavailableReason: 'Ajoutez au moins un service, plus bas sur cette page.',
		fixHref: '#services'
	},
	news: {
		title: 'Actualités',
		description: 'Vos dernières actualités, de la plus récente à la plus ancienne.',
		unavailableReason: 'Ajoutez au moins une actualité, plus bas sur cette page.',
		fixHref: '#actualites'
	},
	prescriptionUpload: {
		title: 'Envoi d’ordonnance',
		description: 'Vos patients vous envoient leur ordonnance depuis le site.',
		unavailableReason: 'L’envoi d’ordonnance n’est pas disponible pour ce site.'
	},
	brands: {
		title: 'Marques',
		description: 'Les marques que vous proposez, avec leur logo.',
		unavailableReason: 'Ajoutez au moins une marque, dans le bloc Marques.',
		fixHref: '#marques'
	},
	appointment: {
		title: 'Prise de rendez-vous',
		description: 'Vos patients réservent un créneau depuis le site, ou vont sur votre outil habituel.',
		unavailableReason: 'Renseignez l’adresse de votre site de rendez-vous, dans le bloc Rendez-vous.',
		fixHref: '#rendez-vous'
	},
	onlineOrder: {
		title: 'Commande en ligne',
		description: 'Un lien vers votre site de commande, aussi accessible par /commandeenligne.',
		unavailableReason: 'Renseignez l’adresse de votre site de commande, dans le bloc Commande en ligne.',
		fixHref: '#commande'
	},
	dutyHotline: {
		title: 'Numéro de garde (3237)',
		description: 'Un rappel du 3237, qui oriente vers la pharmacie de garde la plus proche. Vous choisissez sa place.',
		unavailableReason: 'Ce bloc n’est pas disponible pour ce site.'
	},
	loyaltyCard: {
		title: 'Carte de fidélité',
		description: 'La carte de fidélité de votre groupement.',
		unavailableReason: 'Proposée seulement si votre groupement a une carte de fidélité.'
	}
};

const groupNewsTexts: ModuleTexts = {
	title: 'Actualités',
	description: 'Les actualités de votre groupement, de la plus récente à la plus ancienne.',
	unavailableReason: 'Votre groupement n’a encore publié aucune actualité.'
};

export function listSiteModuleChoices(base: SiteEditorBase, draft: SiteContentDraft): SiteModuleChoice[] {
	const availableModuleData = collectAvailableModuleData(base, draft);
	const textsByModule = { ...moduleTexts, news: findNewsTexts(base, draft) };
	return ModuleNameSchema.options.map((moduleName) => {
		const { title, description, unavailableReason, fixHref } = textsByModule[moduleName];
		const isAvailable = availableModuleData[moduleName] !== undefined;
		return { moduleName, title, description, state: toModuleState(base, moduleName, isAvailable, unavailableReason, fixHref) };
	});
}

function findNewsTexts(base: SiteEditorBase, draft: SiteContentDraft): ModuleTexts {
	return chooseDisplayedNewsSource(draft.newsSource, base.group).source === 'group' ? groupNewsTexts : moduleTexts.news;
}

// Un module sans données est indisponible, même imposé : il n'aurait rien à montrer.
function toModuleState(
	base: SiteEditorBase,
	moduleName: ModuleName,
	isAvailable: boolean,
	unavailableReason: string,
	fixHref: string | undefined
): SiteModuleChoice['state'] {
	if (!isAvailable) return { kind: 'unavailable', reason: unavailableReason, fixHref };
	if (base.group?.mandatoryModules.includes(moduleName)) return { kind: 'mandatory', groupName: base.group.name };
	return { kind: 'optional' };
}
