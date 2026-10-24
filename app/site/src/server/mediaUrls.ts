// Des adresses relatives : le navigateur les demande au domaine du site, donc
// la passerelle y pose le même tenant que pour la page.

export function toEmployeePhotoUrl(photoId: string): string {
  return `/__media/employee-photos/${photoId}`;
}

export function toGroupImageUrl(imageId: string): string {
  return `/__media/group-images/${imageId}`;
}
