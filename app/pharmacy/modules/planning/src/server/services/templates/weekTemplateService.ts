import * as v from 'valibot';
import { addDays, toIsoDate } from '../../../domain/calendar/week';
import { findBlockingRule } from '../../../domain/availability/availabilityRules';
import { findOverlappingShift, type Shift } from '../../../domain/planning';
import {
	pickTemplateForWeek,
	toShiftsOfWeek,
	toTemplateShifts,
	type TemplateRotation,
	type WeekTemplate
} from '../../../domain/templates/weekTemplates';
import { listAvailabilityRules } from '../../repositories/availabilityRuleRepository';
import { deleteWeekTemplate, insertWeekTemplate, listWeekTemplates } from '../../repositories/weekTemplateRepository';
import { insertShift, listShifts } from '../../repositories/planningRepository';
import { getWeekPlanning } from '../team/teamPlanningService';
import { returnWeekToDraft } from '../week/weekStatusService';

export type TemplateChangeResult = { isSaved: true; message?: string } | { isSaved: false; message: string };

const TemplateNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1, 'Donnez un nom à la semaine type.'), v.maxLength(60, 'Le nom est limité à 60 caractères.'));
const RotationSchema = v.picklist(['A', 'B', 'none']);

export const findWeekTemplates = (tenantId: string): Promise<WeekTemplate[]> => listWeekTemplates(tenantId);

/** Garde les créneaux de la semaine affichée comme modèle réutilisable. */
export async function saveWeekAsTemplate(tenantId: string, monday: Date, name: string, rotation: string): Promise<TemplateChangeResult> {
	const parsedName = v.safeParse(TemplateNameSchema, name);
	if (!parsedName.success) return { isSaved: false, message: parsedName.issues[0].message };
	const parsedRotation = v.safeParse(RotationSchema, rotation);
	if (!parsedRotation.success) return { isSaved: false, message: 'Rotation inconnue.' };

	const weekShifts = await listShifts(tenantId, toIsoDate(monday), toIsoDate(addDays(monday, 6)));
	if (weekShifts.length === 0) return { isSaved: false, message: 'Cette semaine est vide : posez d’abord quelques créneaux.' };

	const templateRotation: TemplateRotation | undefined = parsedRotation.output === 'none' ? undefined : parsedRotation.output;
	await insertWeekTemplate(tenantId, { name: parsedName.output, rotation: templateRotation, shifts: toTemplateShifts(weekShifts) });
	return { isSaved: true };
}

export async function removeWeekTemplate(tenantId: string, templateId: string): Promise<void> {
	if (!v.is(v.pipe(v.string(), v.uuid()), templateId)) return;
	await deleteWeekTemplate(tenantId, templateId);
}

/**
 * Pose la semaine type sur la semaine donnée sans toucher à l'existant : on saute les créneaux
 * qui chevauchent un créneau déjà posé, tombent sur une absence ou sur une indisponibilité.
 */
export async function applyWeekTemplate(tenantId: string, monday: Date, templateId: string): Promise<TemplateChangeResult> {
	const templates = await listWeekTemplates(tenantId);
	const template = templateId === 'auto' ? pickTemplateForWeek(templates, monday) : templates.find((candidate) => candidate.id === templateId);
	if (!template) return { isSaved: false, message: 'Aucune semaine type ne correspond à cette semaine.' };

	const [weekPlanning, availabilityRules] = await Promise.all([
		getWeekPlanning(tenantId, toIsoDate(monday), toIsoDate(addDays(monday, 6))),
		listAvailabilityRules(tenantId, ['approved'])
	]);
	const knownEmployeeIds = new Set(weekPlanning.employees.map((employee) => employee.id));
	const placedShifts: Shift[] = [...weekPlanning.shifts];
	let addedCount = 0;
	let skippedCount = 0;

	for (const candidate of toShiftsOfWeek(template, monday)) {
		const isAbsent = weekPlanning.absences.some(
			(absence) => absence.employeeId === candidate.employeeId && absence.firstDate <= candidate.date && candidate.date <= absence.lastDate
		);
		const isBlocked = findBlockingRule(availabilityRules, candidate.employeeId, candidate.date, candidate.startTime, candidate.endTime) !== undefined;
		const isFree = findOverlappingShift(placedShifts, candidate) === undefined;
		if (!knownEmployeeIds.has(candidate.employeeId) || isAbsent || isBlocked || !isFree) {
			skippedCount += 1;
			continue;
		}
		await insertShift(tenantId, candidate);
		placedShifts.push({ id: crypto.randomUUID(), ...candidate });
		addedCount += 1;
	}

	return { isSaved: true, message: `${addedCount} créneau(x) posé(s), ${skippedCount} ignoré(s).` };
}
