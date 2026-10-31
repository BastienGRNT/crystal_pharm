import { isSiteImageSuggestionKey, renderSiteImageSuggestion } from '@crystal-pharm/content-db/domain';
import type { APIEvent } from '@solidjs/start/server';
import { toImageResponse } from '../../../server/mediaResponse';

// Les illustrations de la plateforme sont les mêmes pour tous les sites : aucun Tenant à résoudre.
export async function GET(event: APIEvent) {
  const suggestionKey = event.params.suggestionKey;
  if (!suggestionKey || !isSiteImageSuggestionKey(suggestionKey)) return toImageResponse(undefined);
  return toImageResponse({ bytes: new TextEncoder().encode(renderSiteImageSuggestion(suggestionKey)), contentType: 'image/svg+xml' });
}
