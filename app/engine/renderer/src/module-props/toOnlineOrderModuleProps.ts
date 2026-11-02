import type { OnlineOrderModuleData } from '@crystal-pharm/schema';
import { onlineOrderStablePath } from '../redirect/findStableRedirectLocation';

export type OnlineOrderModuleProps = {
  introduction?: string;
  /** Le lien à afficher : l'adresse stable du site, qui redirige vers le site de commande. */
  orderPath: typeof onlineOrderStablePath;
};

export function toOnlineOrderModuleProps(data: OnlineOrderModuleData): OnlineOrderModuleProps {
  return { introduction: data.introduction, orderPath: onlineOrderStablePath };
}
