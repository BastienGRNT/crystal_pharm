import type { PlaygroundCatalog, ScenarioOutcome } from '../../shared/PlaygroundCatalog';
import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';

const panelApiPath = '/__playground';

export async function fetchPlaygroundCatalog(): Promise<PlaygroundCatalog> {
  const response = await fetch(`${panelApiPath}/catalog`);
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

/** Remplace le scénario rendu par les aperçus ; la réponse dit déjà si les données passent et si le rendu réussit. */
export async function sendPlaygroundScenario(scenario: PlaygroundScenario, requestedPath: string): Promise<ScenarioOutcome> {
  const response = await fetch(`${panelApiPath}/scenario?path=${encodeURIComponent(requestedPath)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(scenario),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return response.json();
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => undefined);
  const message = typeof body === 'object' && body !== null && 'error' in body ? body.error : undefined;
  return typeof message === 'string' ? message : `Le banc d'essai a répondu ${response.status}.`;
}
