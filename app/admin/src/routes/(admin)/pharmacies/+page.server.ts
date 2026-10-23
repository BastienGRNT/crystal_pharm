import { loadPharmacyList } from '$lib/server/services/pharmacies/pharmacyListPage.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ pharmacies: await loadPharmacyList() });
