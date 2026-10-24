type StoredImage = { bytes: Uint8Array<ArrayBuffer>; contentType: string };

/** Une image prend un nouvel identifiant à chaque remplacement : son adresse se garde en cache sans limite. */
const cacheControlOfStoredImage = 'public, max-age=31536000, immutable';

// Un logo SVG ouvert seul est un document : on lui interdit tout code et toute
// adresse extérieure, même s'il a passé la vérification à l'envoi.
export const imageContentSecurityPolicy = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";

export function toImageResponse(image: StoredImage | undefined, cacheControl: string = cacheControlOfStoredImage): Response {
  if (!image) return new Response('Image introuvable.', { status: 404 });
  return new Response(image.bytes, {
    headers: {
      'content-type': image.contentType,
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff',
      'content-security-policy': imageContentSecurityPolicy,
    },
  });
}
