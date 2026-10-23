import { formatTodayTitle } from '../domain/today';
import type { ToolsHomePageData } from '../pages/toolsHomePageData';

export async function load(): Promise<ToolsHomePageData> {
	return { todayTitle: formatTodayTitle(new Date()) };
}
