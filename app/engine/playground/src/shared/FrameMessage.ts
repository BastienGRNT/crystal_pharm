export const frameMessageSource = 'crystal-pharm-playground-frame';

/** Ce que le script injecté dans chaque aperçu envoie au panneau. */
export type FrameMessage = { source: typeof frameMessageSource } & (
  | { kind: 'navigated'; path: string; title: string }
  | { kind: 'problem'; level: 'error' | 'warning'; text: string }
  | { kind: 'hydrated'; reusedNodePercentage: number; nodeCount: number }
  | { kind: 'shortcut'; code: string; altKey: boolean; ctrlKey: boolean; shiftKey: boolean }
);

export function isFrameMessage(data: unknown): data is FrameMessage {
  return typeof data === 'object' && data !== null && 'source' in data && data.source === frameMessageSource;
}
