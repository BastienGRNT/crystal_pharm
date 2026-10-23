import { loadGroupList } from '$lib/server/services/groups/groupListPage.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ groups: await loadGroupList() });
