import type { FilterTab } from '@crystal-pharm/ui';
import { homePathnames } from '../../homePathnames';
import type { PharmacySection } from './pharmacyPageData';

export const pharmacySectionQueryParameter = 'onglet';

const pharmacySectionTabs: ReadonlyArray<{ section: PharmacySection; label: string; href: string }> = [
	{ section: 'contactDetails', label: 'Coordonnées', href: homePathnames.pharmacy },
	{ section: 'openingHours', label: 'Horaires', href: homePathnames.pharmacyOpeningHours },
	{ section: 'team', label: 'Équipe', href: homePathnames.pharmacyTeam },
	{ section: 'group', label: 'Groupement', href: homePathnames.pharmacyGroup }
];

const sectionsBySlug: Record<string, PharmacySection> = { horaires: 'openingHours', equipe: 'team', groupement: 'group' };

/** L'onglet demandé par `?onglet=` ; les coordonnées par défaut, si la valeur est inconnue ou sans groupement. */
export function readSelectedPharmacySection(searchParams: URLSearchParams, hasGroup: boolean): PharmacySection {
	const requestedSection = sectionsBySlug[searchParams.get(pharmacySectionQueryParameter) ?? ''];
	if (requestedSection === undefined || (requestedSection === 'group' && !hasGroup)) return 'contactDetails';
	return requestedSection;
}

export function toPharmacySectionTabs(selectedSection: PharmacySection, hasGroup: boolean): FilterTab[] {
	return pharmacySectionTabs
		.filter(({ section }) => hasGroup || section !== 'group')
		.map(({ section, label, href }) => ({ label, href, isCurrent: section === selectedSection }));
}
