import { eq } from 'drizzle-orm';
import type { EmployeeTerms } from '../../domain/rules/employeeTerms';
import { runAsTenant } from '../db/planningDatabase.server';
import { employeeTerms } from '../db/planningTables';

export async function listEmployeeTerms(tenantId: string): Promise<EmployeeTerms[]> {
	const termsRows = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(employeeTerms).where(eq(employeeTerms.tenantId, tenantId))
	);
	return termsRows.map((termsRow) => ({
		employeeId: termsRow.employeeId,
		weeklyContractMinutes: termsRow.weeklyContractMinutes ?? undefined,
		hourlyRateCents: termsRow.hourlyRateCents ?? undefined,
		isStudent: termsRow.isStudent,
		availabilityValidation: termsRow.availabilityValidation
	}));
}

export async function saveEmployeeTerms(tenantId: string, terms: EmployeeTerms): Promise<void> {
	const { employeeId, ...values } = terms;
	const storedValues = {
		weeklyContractMinutes: values.weeklyContractMinutes ?? null,
		hourlyRateCents: values.hourlyRateCents ?? null,
		isStudent: values.isStudent,
		availabilityValidation: values.availabilityValidation
	};
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.insert(employeeTerms)
			.values({ tenantId, employeeId, ...storedValues })
			.onConflictDoUpdate({
				target: [employeeTerms.tenantId, employeeTerms.employeeId],
				set: { ...storedValues, updatedAt: new Date() }
			})
	);
}

export async function findEmployeeTerms(tenantId: string, employeeId: string): Promise<EmployeeTerms | undefined> {
	const termsList = await listEmployeeTerms(tenantId);
	return termsList.find((terms) => terms.employeeId === employeeId);
}
