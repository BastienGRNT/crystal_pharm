import { toPrescriptionFormData, type SendPrescription } from '@crystal-pharm/renderer';

/** Le navigateur n'appelle jamais le C# : il envoie au serveur du site, qui ajoute le Tenant et l'identité de service. */
export const sendPrescriptionToSiteServer: SendPrescription = async (request) => {
  try {
    const response = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'idempotency-key': crypto.randomUUID() },
      body: toPrescriptionFormData(request),
    });
    return response.ok ? { outcome: 'sent' } : { outcome: 'failed' };
  } catch {
    return { outcome: 'failed' };
  }
};
