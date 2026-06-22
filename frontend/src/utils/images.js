export function photoUri(foto) {
  if (!foto) return null;

  if (typeof foto === 'string') {
    if (!foto.trim()) return null;
    return foto.startsWith('http') || foto.startsWith('data:image/')
      ? foto
      : `data:image/jpeg;base64,${foto}`;
  }

  if (foto.url && String(foto.url).trim()) return foto.url;
  if (foto.contenidoBase64 && String(foto.contenidoBase64).trim()) {
    return `data:image/jpeg;base64,${foto.contenidoBase64}`;
  }
  return null;
}

export function firstPhotoUri(fotos) {
  return (fotos || []).map(photoUri).find(Boolean) || null;
}
