import { listTenantBillings, type TenantBilling } from '@crystal-pharm/billing-db';

export function loadPharmacyList(): Promise<TenantBilling[]> {
	return listTenantBillings();
}
