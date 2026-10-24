import { readPreviewMediaSecret, readPreviewMediaToken, type PreviewMedia } from '@crystal-pharm/content-db/preview-media';
import { readGroupImageOfTenant } from '@crystal-pharm/group-db';
import { readEmployeePhoto } from '@crystal-pharm/pharmacy-db';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';

// Une image du site en cours d'édition : son jeton, signé par site-manager, dit
// de quel Tenant elle est. Elle n'est gardée que par ce navigateur.
export async function GET(event: APIEvent) {
  const media = readPreviewMediaToken(event.params.token ?? '', readPreviewMediaSecret());
  if (!media) return toImageResponse(undefined);
  return toImageResponse(await readPreviewMedia(media), 'private, max-age=3600');
}

function readPreviewMedia({ kind, tenantId, fileId }: PreviewMedia) {
  switch (kind) {
    case 'employee-photo':
      return readEmployeePhoto(tenantId, fileId);
    case 'group-image':
      return readGroupImageOfTenant(tenantId, fileId);
  }
}
