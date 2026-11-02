import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { error } from '@sveltejs/kit';
import { parsePayrollMonth } from '../domain/accountant-export/monthlyPayrollExport';
import { requirePlanningManager } from './activeTenant.server';
import { buildMonthlyPlanningFile } from './services/accountant-export/accountantExportService';

type DownloadRequest = {
	request: Request;
	locals: { user: AuthenticatedUser | null };
};

/** Le CSV du mois choisi, tel que l'expert-comptable le reçoit. */
export async function POST({ request, locals }: DownloadRequest): Promise<Response> {
	const { tenantId } = await requirePlanningManager(locals.user);
	const month = parsePayrollMonth(String((await request.formData()).get('month') ?? ''));
	if (!month) error(400, 'Choisissez un mois.');

	const { fileName, csv } = await buildMonthlyPlanningFile(tenantId, month);
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-store'
		}
	});
}
