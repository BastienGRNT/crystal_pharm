import { eq } from 'drizzle-orm';
import { defaultPlanningRules, type PlanningRules } from '../../domain/rules/planningRules';
import { runAsTenant } from '../db/planningDatabase.server';
import { planningSettings } from '../db/planningTables';

export async function findPlanningRules(tenantId: string): Promise<PlanningRules> {
	const [settingsRow] = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(planningSettings).where(eq(planningSettings.tenantId, tenantId))
	);
	if (!settingsRow) return defaultPlanningRules;
	return {
		minimumPharmacistsPresent: settingsRow.minimumPharmacistsPresent,
		minimumPeoplePresent: settingsRow.minimumPeoplePresent,
		minimumShiftMinutes: settingsRow.minimumShiftMinutes,
		maximumShiftsPerDay: settingsRow.maximumShiftsPerDay,
		minimumRestMinutes: settingsRow.minimumRestMinutes
	};
}

export async function savePlanningRules(tenantId: string, rules: PlanningRules): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.insert(planningSettings)
			.values({ tenantId, ...rules })
			.onConflictDoUpdate({ target: planningSettings.tenantId, set: { ...rules, updatedAt: new Date() } })
	);
}
