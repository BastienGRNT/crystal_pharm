import { field, image, list, prose, seal, text, type Trusted, type TrustedImageUrl } from '../trusted';

/**
 * `note` est saisi par le gérant même si certains designs ne l'affichent pas.
 * Changer de design ne perd jamais une donnée : elle est seulement non rendue.
 */
export type TeamContent = {
	title: string;
	members: { name: string; role: string; photo: TrustedImageUrl | null; note: string | null }[];
};

export function parseTeam(raw: unknown): Trusted<TeamContent> | null {
	const title = text(field(raw, 'title'), 80);
	const members = list(
		field(raw, 'members'),
		(member) => {
			const name = text(field(member, 'name'), 80);
			const role = text(field(member, 'role'), 80);
			if (name === null || role === null) return null;
			return {
				name,
				role,
				photo: image(field(member, 'photo')),
				note: prose(field(member, 'note'), 300)
			};
		},
		30
	);
	if (title === null || members.length === 0) return null;
	return seal({ title, members });
}
