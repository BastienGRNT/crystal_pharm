import { composeMonthlyPlanningExportEmail, sendEmail } from '@crystal-pharm/email';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import * as v from 'valibot';
import {
	buildPayrollFileName,
	buildPayrollRows,
	formatPayrollMonthLabel,
	listMondaysOfPayrollMonth,
	parsePayrollMonth,
	renderPayrollCsv,
	type PayrollMonth
} from '../../../domain/accountant-export/monthlyPayrollExport';
import { collectiveAgreementOvertimeRules } from '../../../domain/overtime/overtimePay';
import { findAccountantEmail, saveAccountantEmail } from '../../repositories/planningSettingsRepository';
import { loadLiveWeekInput } from '../week/weekIssuesService';

export { findAccountantEmail };

export type AccountantExportResult = { isDone: true; message: string } | { isDone: false; message: string };

export type MonthlyPlanningFile = { fileName: string; csv: string };

const AccountantEmailSchema = v.pipe(v.string(), v.trim(), v.maxLength(254), v.email('Saisissez une adresse email valide.'));

/** Vide, l'adresse est retirée. */
export async function updateAccountantEmail(tenantId: string, emailText: string): Promise<AccountantExportResult> {
	if (emailText.trim() === '') {
		await saveAccountantEmail(tenantId, undefined);
		return { isDone: true, message: 'Adresse retirée.' };
	}
	const validation = v.safeParse(AccountantEmailSchema, emailText);
	if (!validation.success) return { isDone: false, message: validation.issues[0].message };
	await saveAccountantEmail(tenantId, validation.output);
	return { isDone: true, message: 'Adresse enregistrée.' };
}

export async function buildMonthlyPlanningFile(tenantId: string, month: PayrollMonth): Promise<MonthlyPlanningFile> {
	const weeks = await Promise.all(listMondaysOfPayrollMonth(month).map((monday) => loadLiveWeekInput(tenantId, monday)));
	const overtimeRules = weeks[0]?.overtimeRules ?? collectiveAgreementOvertimeRules;
	return { fileName: buildPayrollFileName(month), csv: renderPayrollCsv(buildPayrollRows(weeks), overtimeRules) };
}

/** « Envoyer maintenant » : ce que fera l'envoi automatique en début de mois, une fois les tâches planifiées en place. */
export async function sendMonthlyPlanningToAccountant(tenantId: string, monthText: string): Promise<AccountantExportResult> {
	const month = parsePayrollMonth(monthText);
	if (!month) return { isDone: false, message: 'Choisissez un mois.' };
	const accountantEmail = await findAccountantEmail(tenantId);
	if (!accountantEmail) return { isDone: false, message: 'Renseignez d’abord l’adresse de votre expert-comptable.' };

	const [{ fileName, csv }, pharmacyProfile] = await Promise.all([buildMonthlyPlanningFile(tenantId, month), getPharmacyProfile(tenantId)]);
	const monthLabel = formatPayrollMonthLabel(month);
	await sendEmail(
		composeMonthlyPlanningExportEmail({ to: accountantEmail, pharmacyName: pharmacyProfile.name, monthLabel, fileName, csv })
	);
	return { isDone: true, message: `Planning de ${monthLabel} envoyé à ${accountantEmail}.` };
}
