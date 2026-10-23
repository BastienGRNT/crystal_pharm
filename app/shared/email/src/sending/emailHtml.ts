import type { Email } from './email';

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Un HTML d'email volontairement sobre : des paragraphes, puis un bouton par lien. */
export function renderEmailHtml(email: Email): string {
	const paragraphs = email.text
		.split(/\n{2,}/)
		.map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
		.join('');
	const buttons = email.actionLinks
		.map(
			(actionLink) =>
				`<p style="margin:24px 0"><a href="${escapeHtml(actionLink.url)}" style="background:#0e7c6b;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:600">${escapeHtml(actionLink.label)}</a></p>`
		)
		.join('');
	return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:22px;color:#14232b;max-width:560px">${paragraphs}${buttons}</div>`;
}
