import { and, asc, eq } from 'drizzle-orm';
import type { WeekTemplate, WeekTemplateShift } from '../../domain/templates/weekTemplates';
import { runAsTenant, toHoursAndMinutes } from '../db/planningDatabase.server';
import { weekTemplates, weekTemplateShifts } from '../db/planningTables';

export type NewWeekTemplate = Omit<WeekTemplate, 'id'>;

export async function listWeekTemplates(tenantId: string): Promise<WeekTemplate[]> {
	const [templateRows, shiftRows] = await runAsTenant(tenantId, (transaction) =>
		Promise.all([
			transaction.select().from(weekTemplates).where(eq(weekTemplates.tenantId, tenantId)).orderBy(asc(weekTemplates.createdAt)),
			transaction.select().from(weekTemplateShifts).where(eq(weekTemplateShifts.tenantId, tenantId))
		])
	);
	return templateRows.map((templateRow) => ({
		id: templateRow.id,
		name: templateRow.name,
		rotation: templateRow.rotation ?? undefined,
		shifts: shiftRows
			.filter((shiftRow) => shiftRow.templateId === templateRow.id)
			.map(
				(shiftRow): WeekTemplateShift => ({
					employeeId: shiftRow.employeeId,
					weekday: shiftRow.weekday,
					startTime: toHoursAndMinutes(shiftRow.startTime),
					endTime: toHoursAndMinutes(shiftRow.endTime)
				})
			)
	}));
}

export async function insertWeekTemplate(tenantId: string, newTemplate: NewWeekTemplate): Promise<void> {
	await runAsTenant(tenantId, async (transaction) => {
		const templateId = crypto.randomUUID();
		await transaction.insert(weekTemplates).values({ id: templateId, tenantId, name: newTemplate.name, rotation: newTemplate.rotation ?? null });
		if (newTemplate.shifts.length === 0) return;
		await transaction
			.insert(weekTemplateShifts)
			.values(newTemplate.shifts.map((shift) => ({ id: crypto.randomUUID(), tenantId, templateId, ...shift })));
	});
}

export async function deleteWeekTemplate(tenantId: string, templateId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.delete(weekTemplates).where(and(eq(weekTemplates.tenantId, tenantId), eq(weekTemplates.id, templateId)))
	);
}
