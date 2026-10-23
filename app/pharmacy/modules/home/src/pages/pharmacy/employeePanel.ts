import type { EmployeePanel, TeamMember } from './pharmacyPageData';

const employeePanelQueryParameter = 'membre';
const newEmployeePanelValue = 'nouveau';

/** Le panneau demandé par `?membre=` : `nouveau`, ou un membre de l'équipe ; aucun si la valeur est inconnue. */
export function readRequestedEmployeePanel(searchParams: URLSearchParams, team: TeamMember[]): EmployeePanel | undefined {
	const requestedEmployee = searchParams.get(employeePanelQueryParameter);
	if (requestedEmployee === newEmployeePanelValue) return { employeeId: undefined };
	const teamMember = team.find((candidate) => candidate.employeeId === requestedEmployee);
	return teamMember ? { employeeId: teamMember.employeeId } : undefined;
}
