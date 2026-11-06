import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const presignedReadLink = 'https://health-storage.example/prescriptions/tenant/submission/document?X-Amz-Signature=secret';

vi.mock('./api/receivedPrescriptionsApi.server', () => ({
	createReceivedDocumentLink: vi.fn(async () => presignedReadLink)
}));
vi.mock('./prescriptionsCaller.server', () => ({
	requirePrescriptionsCaller: vi.fn(async () => ({ accountId: 'account', tenantId: 'tenant' }))
}));

const { createReceivedDocumentLink } = await import('./api/receivedPrescriptionsApi.server');
const { GET } = await import('./documentReadLink.server');

const signedInUser = { userId: 'account' } as AuthenticatedUser;
const params = { submissionId: 'submission', documentId: 'document' };

function requestWithFetchMode(fetchMode: string): Request {
	return new Request('http://localhost/prescriptions/submission/fichiers/document', { headers: { 'sec-fetch-mode': fetchMode } });
}

describe('the read link of a prescription file', () => {
	beforeEach(() => vi.mocked(createReceivedDocumentLink).mockClear());

	it('is never given to a page opened in the address bar, nor asked of the C#', async () => {
		await expect(GET({ params, request: requestWithFetchMode('navigate'), locals: { user: signedInUser } })).rejects.toMatchObject({
			status: 404
		});
		expect(createReceivedDocumentLink).not.toHaveBeenCalled();
	});

	it('is given to a background read, without redirect and without cache', async () => {
		const response = await GET({ params, request: requestWithFetchMode('cors'), locals: { user: signedInUser } });

		expect(response.status).toBe(200);
		expect(response.headers.get('location')).toBeNull();
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ url: presignedReadLink });
	});
});
