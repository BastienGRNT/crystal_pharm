import { eq } from 'drizzle-orm';
import { collectiveAgreementOvertimeRules, type OvertimeRules } from '../../domain/overtime/overtimePay';
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

export async function findOvertimeRules(tenantId: string): Promise<OvertimeRules> {
	const [settingsRow] = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(planningSettings).where(eq(planningSettings.tenantId, tenantId))
	);
	if (!settingsRow) return collectiveAgreementOvertimeRules;
	return {
		weeklyThresholdMinutes: settingsRow.overtimeWeeklyThresholdMinutes,
		firstBandMinutes: settingsRow.overtimeFirstBandMinutes,
		firstBandRatePercent: settingsRow.overtimeFirstBandRatePercent,
		beyondRatePercent: settingsRow.overtimeBeyondRatePercent
	};
}

export async function saveOvertimeRules(tenantId: string, rules: OvertimeRules): Promise<void> {
	const columns = {
		overtimeWeeklyThresholdMinutes: rules.weeklyThresholdMinutes,
		overtimeFirstBandMinutes: rules.firstBandMinutes,
		overtimeFirstBandRatePercent: rules.firstBandRatePercent,
		overtimeBeyondRatePercent: rules.beyondRatePercent
	};
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.insert(planningSettings)
			.values({ tenantId, ...columns })
			.onConflictDoUpdate({ target: planningSettings.tenantId, set: { ...columns, updatedAt: new Date() } })
	);
}

export async function findAccountantEmail(tenantId: string): Promise<string | undefined> {
	const [settingsRow] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ accountantEmail: planningSettings.accountantEmail })
			.from(planningSettings)
			.where(eq(planningSettings.tenantId, tenantId))
	);
	return settingsRow?.accountantEmail ?? undefined;
}

export async function saveAccountantEmail(tenantId: string, accountantEmail: string | undefined): Promise<void> {
	const columns = { accountantEmail: accountantEmail ?? null };
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.insert(planningSettings)
			.values({ tenantId, ...columns })
			.onConflictDoUpdate({ target: planningSettings.tenantId, set: { ...columns, updatedAt: new Date() } })
	);
}
