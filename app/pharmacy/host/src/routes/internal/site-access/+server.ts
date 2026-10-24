import { respondToSiteAccessRequest } from '@crystal-pharm/site-manager/server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => respondToSiteAccessRequest(request);
