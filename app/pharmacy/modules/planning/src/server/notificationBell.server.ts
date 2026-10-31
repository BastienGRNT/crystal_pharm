import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantMemberAccess } from '@crystal-pharm/pharmacy-db';
import { json } from '@sveltejs/kit';
import { formatNoticeAge } from '../domain/notices/noticeAge';
import { listPlanningNoticesOfAccount, markPlanningNoticesAsRead } from './repositories/planningNoticeRepository';

type BellRequest = { locals: { user: AuthenticatedUser | null } };

/** Ce que la cloche affiche ; sans Tenant actif, rien. */
export type PlanningNotificationView = {
	id: string;
	message: string;
	href: string;
	isRead: boolean;
	timeLabel: string;
};

export async function loadPlanningNotifications({ locals }: BellRequest): Promise<PlanningNotificationView[]> {
	const access = locals.user && (await findActiveTenantMemberAccess(locals.user.userId));
	if (!access) return [];
	const now = new Date();
	const notices = await listPlanningNoticesOfAccount(access.tenantId, access.accountId);
	return notices.map((notice) => ({
		id: notice.id,
		message: notice.message,
		href: notice.linkPathname,
		isRead: notice.isRead,
		timeLabel: formatNoticeAge(notice.createdAt, now)
	}));
}

/** La cloche vient d'être ouverte : ses notifications sont lues. */
export async function markPlanningNotificationsAsRead({ locals }: BellRequest): Promise<Response> {
	const access = locals.user && (await findActiveTenantMemberAccess(locals.user.userId));
	if (access) await markPlanningNoticesAsRead(access.tenantId, access.accountId);
	return json({ isDone: true });
}
