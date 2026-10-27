import type { FilterTab } from '@crystal-pharm/ui';
import { homePathnames } from '../../homePathnames';
import type { PharmacySection } from './pharmacyPageData';

export const pharmacySectionQueryParameter = 'onglet';

const pharmacySectionTabs: ReadonlyArray<{ section: PharmacySection; label: string; href: string }> = [
	{ section: 'contactDetails', label: 'Coordonnées', href: homePathnames.pharmacy },
	{ section: 'openingHours', label: 'Horaires', href: homePathnames.pharmacyOpeningHours },
	{ section: 'team', label: 'Équipe', href: homePathnames.pharmacyTeam },
	{ section: 'group', label: 'Groupement', href: homePathnames.pharmacyGroup },
	{ section: 'access', label: 'Comptes et accès', href: homePathnames.pharmacyAccess }
];

const sectionsBySlug: Record<string, PharmacySection> = {
	horaires: 'openingHours',
	equipe: 'team',
	groupement: 'group',
	acces: 'access'
};

/** Les onglets qui n'existent pas toujours : le groupement (s'il y en a un), les accès (pour un Owner). */
export type OptionalPharmacySections = { hasGroup: boolean; canManageAccess: boolean };

/** L'onglet demandé par `?onglet=` ; les coordonnées par défaut, si la valeur est inconnue ou l'onglet absent. */
export function readSelectedPharmacySection(
	searchParams: URLSearchParams,
	optionalSections: OptionalPharmacySections
): PharmacySection {
	const requestedSection = sectionsBySlug[searchParams.get(pharmacySectionQueryParameter) ?? ''];
	if (requestedSection === undefined || !isSectionShown(requestedSection, optionalSections)) return 'contactDetails';
	return requestedSection;
}

export function toPharmacySectionTabs(selectedSection: PharmacySection, optionalSections: OptionalPharmacySections): FilterTab[] {
	return pharmacySectionTabs
		.filter(({ section }) => isSectionShown(section, optionalSections))
		.map(({ section, label, href }) => ({ label, href, isCurrent: section === selectedSection }));
}

function isSectionShown(section: PharmacySection, { hasGroup, canManageAccess }: OptionalPharmacySections): boolean {
	if (section === 'group') return hasGroup;
	if (section === 'access') return canManageAccess;
	return true;
}
