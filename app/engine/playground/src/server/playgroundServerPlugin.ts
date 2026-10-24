import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { playgroundEvents } from '../shared/PlaygroundCatalog';
import { isSiteHostname } from '../shared/playgroundHosts';
import type { PlaygroundScenario } from '../shared/PlaygroundScenario';
import type * as playgroundRequestHandlers from './playgroundRequestHandlers';
import { createSiteRendererLoader } from './site-rendering/createSiteRendererLoader';
import { watchCompiledSite } from './watchCompiledSite';

const panelApiPathPrefix = '/__playground/';

/**
 * Le serveur du banc d'essai, branché dans celui de Vite. Ce fichier est chargé avec la configuration :
 * il ne dépend que de Node. Les réponses, qui lisent le schéma et les mocks, passent par `ssrLoadModule`.
 */
export function playgroundServerPlugin(paths: { layoutsSourceDirectory: string; compiledSiteDirectory: string; playgroundServerDirectory: string }): Plugin {
  return {
    name: 'crystal-pharm-playground-server',
    apply: 'serve',
    configureServer(server) {
      const loadSiteRenderer = createSiteRendererLoader(join(paths.compiledSiteDirectory, 'server', 'serverEntry.js'));
      const notifyPanel = (eventName: string, payload: unknown) => server.ws.send(eventName, payload);
      const loadRequestHandlers = () => loadPlaygroundRequestHandlers(server, join(paths.playgroundServerDirectory, 'playgroundRequestHandlers.ts'));
      let currentScenario: PlaygroundScenario | undefined;

      const stopWatchingCompiledSite = watchCompiledSite(paths.compiledSiteDirectory, {
        onRebuilding: () => notifyPanel(playgroundEvents.siteRebuilding, {}),
        onRebuilt: () => notifyPanel(playgroundEvents.siteRebuilt, {}),
      });
      server.httpServer?.once('close', stopWatchingCompiledSite);

      server.middlewares.use((request, response, next) => {
        const isSiteRequest = isSiteHostname(readHostname(request));
        const isPanelApiRequest = request.url?.startsWith(panelApiPathPrefix) ?? false;
        if (!isSiteRequest && !isPanelApiRequest) {
          next();
          return;
        }
        void (async () => {
          const handlers = await loadRequestHandlers();
          currentScenario ??= handlers.createInitialScenario();
          if (isSiteRequest) {
            await handlers.handleSiteRequest(request, response, {
              readCurrentScenario: () => currentScenario ?? handlers.createInitialScenario(),
              loadSiteRenderer,
              compiledClientDirectory: join(paths.compiledSiteDirectory, 'client'),
              notifyPanel,
            });
          } else {
            await handlers.handlePanelApiRequest(request, response, {
              replaceCurrentScenario: (scenario) => {
                currentScenario = scenario;
              },
              loadSiteRenderer,
              layoutsSourceDirectory: paths.layoutsSourceDirectory,
            });
          }
        })().catch((error: unknown) => respondWithServerError(response, error));
      });
    },
    // Un mock ou une étape de scénario modifié : Vite recharge le module côté serveur, l'aperçu doit suivre.
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(paths.playgroundServerDirectory)) return;
      server.ws.send(playgroundEvents.siteRebuilt, {});
      return [];
    },
  };
}

async function loadPlaygroundRequestHandlers(server: ViteDevServer, requestHandlersFile: string): Promise<typeof playgroundRequestHandlers> {
  // `ssrLoadModule` ne connaît pas les exports du fichier qu'il charge : c'est celui importé en type ci-dessus.
  return (await server.ssrLoadModule(requestHandlersFile)) as typeof playgroundRequestHandlers;
}

function readHostname(request: IncomingMessage): string {
  return (request.headers.host ?? '').replace(/:\d+$/, '');
}

function respondWithServerError(response: ServerResponse, error: unknown): void {
  if (response.headersSent) {
    response.end();
    return;
  }
  response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(`Erreur du banc d'essai :\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
}
