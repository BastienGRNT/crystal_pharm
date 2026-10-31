import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import type { Employee } from '@crystal-pharm/pharmacy-db';
import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { ModuleDataByName, SiteEditorBase } from '../../domain/siteDraft';
import { listUploadedImageIdsOfContent } from '../../domain/siteImageChoices';
import { toPreviewMediaUrl } from './previewMediaUrls.server';
import type { SiteEditorSources } from '../repositories/tenantSiteRepository.server';

/**
 * L'adapter : les trois bases → ce que l'édition ne change pas. Mêmes sources
 * que `app/site`, mais les images ont des adresses signées de l'aperçu.
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
		group: group && {
			name: group.name,
			logoUrl: group.logoId ? toPreviewMediaUrl('group-image', tenantId, group.logoId) : undefined,
			mandatoryModules: readMandatoryModules(group.mandatoryModules),
			imposesGroupNews: group.imposesGroupNews,
			articles: group.articles.map(({ title, summary, publishedAt }) => ({ title, summary, publishedAt }))
		},
		openingHours: pharmacyProfile.weeklyOpeningSchedule && { weeklySchedule: pharmacyProfile.weeklyOpeningSchedule, onDutyPeriods: [] },
		onDutyPeriods: sources.content?.onDutyPeriods ?? [],
		availableModuleData: collectAvailableModuleData(tenantId, sources),
		uploadedImagePreviewUrls: toUploadedImagePreviewUrls(tenantId, sources)
	};
}

export function toUploadedImagePreviewUrl(tenantId: string, imageId: string): string {
	return toPreviewMediaUrl('site-image', tenantId, imageId);
}

function toUploadedImagePreviewUrls(tenantId: string, { content }: SiteEditorSources): Record<string, string> {
	const imageIds = content ? listUploadedImageIdsOfContent(content) : [];
	return Object.fromEntries(imageIds.map((imageId) => [imageId, toUploadedImagePreviewUrl(tenantId, imageId)]));
}

// Les services, marques, actualités, rendez-vous et commande en ligne se saisissent dans l'éditeur : ils viennent du brouillon, pas d'ici.
function collectAvailableModuleData(
	tenantId: string,
	{ employees, group }: SiteEditorSources
): SiteEditorBase['availableModuleData'] {
	return {
		team: { members: employees.map((employee) => toTeamMember(tenantId, employee)) },
		// Le module `Prescriptions` du C# reçoit les ordonnances : rien à saisir, le module est toujours affichable.
		prescriptionUpload: {},
		dutyHotline: {},
		loyaltyCard:
			group?.loyaltyCardUrl && group.loyaltyCardMessage
				? {
						text: group.loyaltyCardMessage,
						url: group.loyaltyCardUrl,
						imageUrl: group.loyaltyCardImageId ? toPreviewMediaUrl('group-image', tenantId, group.loyaltyCardImageId) : undefined
					}
				: undefined
	};
}

function toTeamMember(tenantId: string, employee: Employee): ModuleDataByName['team']['members'][number] {
	return {
		fullName: formatEmployeeFullName(employee),
		role: employee.jobTitle.toDisplayFormat(),
		photoUrl: employee.photoId ? toPreviewMediaUrl('employee-photo', tenantId, employee.photoId) : undefined
	};
}

// `group-db` ne connaît pas `engine/schema` : un nom qui n'est plus un module est ignoré.
function readMandatoryModules(mandatoryModules: string[]): ModuleName[] {
	return mandatoryModules.filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}
