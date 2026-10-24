import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import type { Employee } from '@crystal-pharm/pharmacy-db';
import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { ModuleDataByName, SiteEditorBase } from '../domain/siteDraft';
import type { SiteEditorSources } from './repositories/tenantSiteRepository.server';

/**
 * L'adapter : les trois bases → ce que l'édition ne change pas. Même règle que
 * `app/site` (un module sans données reste éteint), mais les images sont
 * servies par `pharmacy/host` : l'aperçu tourne sur un autre domaine.
 */
export function toSiteEditorBase(tenantId: string, sources: SiteEditorSources): SiteEditorBase {
	const { pharmacyProfile, group } = sources;
	return {
		tenantId,
		pharmacy: {
			name: pharmacyProfile.name,
			address: { street: pharmacyProfile.street, postalCode: pharmacyProfile.postalCode, city: pharmacyProfile.city },
			phone: pharmacyProfile.phoneNumber.toDisplayFormat(),
			email: pharmacyProfile.email
		},
		// `pharmacy/host` ne sert pas les images du groupement : l'aperçu montre son nom, sans logo.
		group: group && { name: group.name, mandatoryModules: readMandatoryModules(group.mandatoryModules) },
		availableModuleData: collectAvailableModuleData(sources)
	};
}

// Les services et les actualités se saisissent dans l'éditeur : ils viennent du brouillon, pas d'ici.
function collectAvailableModuleData({ pharmacyProfile, employees, group }: SiteEditorSources): SiteEditorBase['availableModuleData'] {
	return {
		openingHours: pharmacyProfile.weeklyOpeningSchedule && {
			weeklySchedule: pharmacyProfile.weeklyOpeningSchedule,
			onDutyPeriods: []
		},
		team: employees.length > 0 ? { members: employees.map(toTeamMember) } : undefined,
		// Aucun module `Prescriptions` dans le C# pour l'instant : une ordonnance ne partirait nulle part.
		prescriptionUpload: undefined,
		loyaltyCard:
			group?.loyaltyCardUrl && group.loyaltyCardMessage
				? { text: group.loyaltyCardMessage, url: group.loyaltyCardUrl }
				: undefined
	};
}

function toTeamMember(employee: Employee): ModuleDataByName['team']['members'][number] {
	return {
		fullName: formatEmployeeFullName(employee),
		role: employee.jobTitle.toDisplayFormat(),
		photoUrl: employee.photoId && toEmployeePhotoUrl(employee.photoId)
	};
}

// La route des photos de l'équipe est celle de `home` (`/pharmacie/equipe/photos/…`) : un module n'importe pas un autre.
function toEmployeePhotoUrl(photoId: string): string {
	return new URL(`/pharmacie/equipe/photos/${encodeURIComponent(photoId)}`, readPharmacyUrl()).href;
}

function readPharmacyUrl(): string {
	const pharmacyUrl = process.env.PHARMACY_URL;
	if (!pharmacyUrl) throw new Error('PHARMACY_URL is missing from the environment.');
	return pharmacyUrl;
}

// `group-db` ne connaît pas `engine/schema` : un nom qui n'est plus un module est ignoré.
function readMandatoryModules(mandatoryModules: string[]): ModuleName[] {
	return mandatoryModules.filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}
