type StoredImage = { bytes: Uint8Array<ArrayBuffer>; contentType: string };

/** Une image prend un nouvel identifiant à chaque remplacement : son adresse se garde en cache sans limite. */
export function toImageResponse(image: StoredImage | undefined): Response {
  if (!image) return new Response('Image introuvable.', { status: 404 });
  return new Response(image.bytes, {
    headers: { 'content-type': image.contentType, 'cache-control': 'public, max-age=31536000, immutable' },
  });
}
