import { frameMessageSource } from '../../shared/FrameMessage';
import { playgroundPanelOrigin } from '../../shared/playgroundHosts';

/**
 * Ce script tourne dans l'aperçu, avant le moteur : il remonte au panneau la navigation, les erreurs
 * (hydratation comprise) et la part des nœuds du serveur réutilisés par l'hydratation.
 * Il n'existe que dans le banc d'essai : l'app des sites ne l'a jamais.
 */
const frameAgentScript = `(() => {
  if (window.parent === window) return;
  const post = (message) => window.parent.postMessage({ source: ${JSON.stringify(frameMessageSource)}, ...message }, ${JSON.stringify(playgroundPanelOrigin)});
  const describe = (value) => {
    if (value instanceof Error) return value.stack || value.message;
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  };
  for (const [method, level] of [['error', 'error'], ['warn', 'warning']]) {
    const original = console[method].bind(console);
    console[method] = (...values) => { post({ kind: 'problem', level, text: values.map(describe).join(' ') }); original(...values); };
  }
  addEventListener('error', (event) => post({ kind: 'problem', level: 'error', text: event.error ? describe(event.error) : event.message }));
  addEventListener('unhandledrejection', (event) => post({ kind: 'problem', level: 'error', text: describe(event.reason) }));

  // « interactive » arrive après la lecture du HTML et avant l'exécution des modules : le DOM est encore celui du serveur.
  const visibleNodes = () => [...document.body.querySelectorAll('*:not(script)')];
  let serverNodes = new Set();
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive') serverNodes = new Set(visibleNodes());
  });
  addEventListener('load', () => {
    post({ kind: 'navigated', path: location.pathname, title: document.title });
    setTimeout(() => {
      const currentNodes = visibleNodes();
      const reusedNodeCount = currentNodes.filter((node) => serverNodes.has(node)).length;
      post({ kind: 'hydrated', reusedNodePercentage: Math.round((reusedNodeCount / Math.max(currentNodes.length, 1)) * 100), nodeCount: currentNodes.length });
    }, 300);
  });
  addEventListener('keydown', (event) => {
    if (!event.altKey && !event.ctrlKey) return;
    post({ kind: 'shortcut', code: event.code, altKey: event.altKey, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey });
  });
})();`;

export function injectFrameAgent(html: string): string {
  const agentTag = `<script>${frameAgentScript}</script>`;
  return html.includes('</head>') ? html.replace('</head>', `${agentTag}</head>`) : `${agentTag}${html}`;
}
